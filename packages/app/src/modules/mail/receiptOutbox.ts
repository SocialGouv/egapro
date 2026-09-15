import "server-only";
import { and, asc, eq, inArray, lt, or, sql } from "drizzle-orm";
import { AUDIT_ACTIONS } from "~/modules/audit";
import { logAction } from "~/server/audit/log";
import { db } from "~/server/db";
import { receiptOutbox } from "~/server/db/schema";
import { reportReceiptFailure, sendReceipt } from "./enqueueReceipt";

export const RECEIPT_OUTBOX_MAX_ATTEMPTS = 5;

// A normal send happens within a second or two; past this, the row belongs to a dead process.
export const RECEIPT_OUTBOX_RETRY_AFTER_MS = 5 * 60_000;

// Caps one retry pass so a backlog cannot exhaust the pod.
export const RECEIPT_OUTBOX_REPLAY_LIMIT = 20;

type OutboxRow = typeof receiptOutbox.$inferSelect;

// The WHERE clause is the lock — only one concurrent UPDATE can match a given row.
async function claim(id: string, staleBefore: Date): Promise<OutboxRow | null> {
	const [row] = await db
		.update(receiptOutbox)
		.set({
			status: "sending",
			attempts: sql`${receiptOutbox.attempts} + 1`,
			updatedAt: new Date(),
		})
		.where(
			and(
				eq(receiptOutbox.id, id),
				or(
					eq(receiptOutbox.status, "pending"),
					and(
						eq(receiptOutbox.status, "sending"),
						lt(receiptOutbox.updatedAt, staleBefore),
					),
				),
			),
		)
		.returning();

	return row ?? null;
}

async function settle(row: OutboxRow, error: string | null, sent: boolean) {
	const exhausted = row.attempts >= RECEIPT_OUTBOX_MAX_ATTEMPTS;
	await db
		.update(receiptOutbox)
		.set({
			status: sent ? "sent" : exhausted ? "failed" : "pending",
			lastError: error,
			updatedAt: new Date(),
			...(sent ? { sentAt: new Date() } : {}),
		})
		.where(eq(receiptOutbox.id, row.id));
}

// Called both by the submitting request and, if that never happened, by the retry endpoint.
export async function deliverReceiptIntent(
	id: string,
	now: Date = new Date(),
): Promise<"sent" | "failed" | "skipped"> {
	const row = await claim(id, new Date(now.getTime() - staleAfterMs()));
	if (!row) return "skipped";

	const { sent, error } = await sendReceipt({
		kind: row.kind,
		to: row.recipientEmail,
		siren: row.siren,
		year: row.year,
		userId: row.userId,
		isResend: false,
		outboxId: row.id,
	});

	await settle(row, error, sent);
	return sent ? "sent" : "failed";
}

// Reclaim only well past the retry window, so the owning request finishes first.
function staleAfterMs(): number {
	return RECEIPT_OUTBOX_RETRY_AFTER_MS * 2;
}

export type ReplayResult = {
	claimed: number;
	sent: number;
	failed: number;
};

export async function replayPendingReceipts(
	options: { now?: Date; limit?: number } = {},
): Promise<ReplayResult> {
	const now = options.now ?? new Date();
	const limit = options.limit ?? RECEIPT_OUTBOX_REPLAY_LIMIT;

	const candidates = await db
		.select({ id: receiptOutbox.id })
		.from(receiptOutbox)
		.where(
			and(
				inArray(receiptOutbox.status, ["pending", "sending"]),
				lt(
					receiptOutbox.updatedAt,
					new Date(now.getTime() - RECEIPT_OUTBOX_RETRY_AFTER_MS),
				),
			),
		)
		.orderBy(asc(receiptOutbox.createdAt))
		.limit(limit);

	const result: ReplayResult = { claimed: 0, sent: 0, failed: 0 };
	for (const { id } of candidates) {
		let outcome: "sent" | "failed" | "skipped";
		try {
			outcome = await deliverReceiptIntent(id, now);
		} catch (error) {
			// claim()/settle() are the only unguarded steps below (sendReceipt never
			// throws) — one row's DB error must not abort the rest of the batch, so
			// it is counted like any other failed row and the pass moves on.
			const errorMessage = reportReceiptFailure(error, {
				stage: "replay",
				outboxId: id,
			});
			void logAction({
				action: AUDIT_ACTIONS.NOTIFICATION_OUTBOX_DELIVERY_FAILED,
				status: "failure",
				resourceType: "receipt_outbox",
				resourceId: id,
				errorMessage,
				metadata: { stage: "replay" },
			});
			result.claimed += 1;
			result.failed += 1;
			continue;
		}
		if (outcome === "skipped") continue;
		result.claimed += 1;
		if (outcome === "sent") result.sent += 1;
		else result.failed += 1;
	}

	if (result.claimed > 0) {
		void logAction({
			action: AUDIT_ACTIONS.NOTIFICATION_OUTBOX_REPLAY_BATCH,
			status: result.failed > 0 ? "failure" : "success",
			metadata: result,
		});
	}

	return result;
}
