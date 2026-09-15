import "server-only";
import { and, asc, eq, inArray, lt, or, sql } from "drizzle-orm";
import { AUDIT_ACTIONS } from "~/modules/audit";
import { logAction } from "~/server/audit/log";
import { db } from "~/server/db";
import { receiptOutbox } from "~/server/db/schema";
import { sendReceipt } from "./enqueueReceipt";

/** Attempts past which a row stops being replayed and is parked as `failed`. */
export const RECEIPT_OUTBOX_MAX_ATTEMPTS = 5;

/**
 * How long a row must sit unsettled before the retry endpoint touches it. The
 * request that created it sends within a second or two; anything still waiting
 * after this window belongs to a process that is not coming back.
 */
export const RECEIPT_OUTBOX_RETRY_AFTER_MS = 5 * 60_000;

/** Upper bound on one retry pass, so a backlog cannot exhaust the pod. */
export const RECEIPT_OUTBOX_REPLAY_LIMIT = 20;

type OutboxRow = typeof receiptOutbox.$inferSelect;

/**
 * Take ownership of a row with a conditional update, so that the request path
 * and a concurrent retry pass can never both render and queue the same
 * receipt: the `WHERE` clause is the lock, and only one `UPDATE` matches.
 *
 * A row left in `sending` by a process that died is reclaimed once it has gone
 * stale — the pg-boss job id derived from `id` is what makes that safe.
 */
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

/**
 * Render and queue one recorded intent, then settle its row.
 *
 * Called twice over a row's life: once by the request that committed the
 * submission — so the acknowledgement keeps leaving as fast as it did before —
 * and, only if that never happened, by the retry endpoint.
 */
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

/**
 * A row is only reclaimed well after the retry window, so the request that
 * owns it has every chance to finish first.
 */
function staleAfterMs(): number {
	return RECEIPT_OUTBOX_RETRY_AFTER_MS * 2;
}

export type ReplayResult = {
	claimed: number;
	sent: number;
	failed: number;
};

/**
 * Replay the receipts nobody sent — the rows whose request died between the
 * commit and the queue.
 */
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
		const outcome = await deliverReceiptIntent(id, now);
		if (outcome === "skipped") continue;
		result.claimed += 1;
		if (outcome === "sent") result.sent += 1;
		else result.failed += 1;
	}

	if (result.claimed > 0) {
		void logAction({
			action: AUDIT_ACTIONS.NOTIFICATION_OUTBOX_REPLAY,
			status: result.failed > 0 ? "failure" : "success",
			metadata: result,
		});
	}

	return result;
}
