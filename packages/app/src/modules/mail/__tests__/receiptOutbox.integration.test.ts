import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";
import { db } from "~/server/db";
import { deliverRecordedReceipt, recordReceiptIntent } from "../receiptIntent";
import {
	deliverReceiptIntent,
	RECEIPT_OUTBOX_RETRY_AFTER_MS,
	replayPendingReceipts,
} from "../receiptOutbox";

// Issue #4542 — acknowledgements went missing because the receipt was queued
// after the commit, by the very process that was about to be OOM-killed, with
// nothing anywhere recording that one was owed. These run against the real
// Postgres driver and the real pg-boss queue: a mocked db cannot show that the
// intent rolls back with its transaction, nor that a replayed row produces one
// job and not two.
describe("receipt outbox (#4542)", () => {
	let sql!: ReturnType<typeof postgres>;

	const SIREN = "123456789";
	const USER_ID = "receipt-outbox-user";
	const EMAIL = "receipt-outbox@example.fr";
	const YEAR = 2026;

	const INTENT = {
		// A kind with no PDF: the attachment renderer is not what these assert.
		kind: "representation" as const,
		to: EMAIL,
		siren: SIREN,
		year: YEAR,
		userId: USER_ID,
	};

	const laterBy = (ms: number) => new Date(Date.now() + ms);
	const STALE = RECEIPT_OUTBOX_RETRY_AFTER_MS + 60_000;

	beforeAll(() => {
		sql = postgres(env.DATABASE_URL, { max: 1 });
	});

	afterAll(async () => {
		await sql.end();
	});

	beforeEach(async () => {
		await sql`DELETE FROM app_receipt_outbox`;
		await sql`DELETE FROM audit.action_log WHERE user_email = ${EMAIL}`;
	});

	async function rows() {
		return sql<
			{
				id: string;
				status: string;
				attempts: number;
				sent_at: Date | null;
				last_error: string | null;
			}[]
		>`SELECT id, status, attempts, sent_at, last_error FROM app_receipt_outbox`;
	}

	async function enqueueAuditCount(outboxId: string) {
		const [row] = await sql<{ count: number }[]>`
			SELECT count(*)::int AS count FROM audit.action_log
			WHERE action = 'notification.enqueue'
			  AND metadata->>'outboxId' = ${outboxId}
		`;
		return row?.count ?? 0;
	}

	async function queuedJobCount(outboxId: string) {
		const [row] = await sql<{ count: number }[]>`
			SELECT count(*)::int AS count FROM pgboss.job WHERE id = ${outboxId}::uuid
		`;
		return row?.count ?? 0;
	}

	// Audit writes are fire-and-forget (`void logAction`), so the row lands a
	// tick or two after the call returns.
	async function waitForAudit(outboxId: string, expected: number) {
		for (let attempt = 0; attempt < 50; attempt++) {
			if ((await enqueueAuditCount(outboxId)) >= expected) return;
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
		expect(await enqueueAuditCount(outboxId)).toBe(expected);
	}

	it("rolls the intent back with the transaction that recorded it", async () => {
		await expect(
			db.transaction(async (tx) => {
				await recordReceiptIntent(tx, INTENT);
				throw new Error("submission failed after recording the intent");
			}),
		).rejects.toThrow("submission failed");

		expect(await rows()).toHaveLength(0);
	});

	it("commits the intent with the démarche, owed and not yet sent", async () => {
		const id = await db.transaction((tx) => recordReceiptIntent(tx, INTENT));

		const [row] = await rows();
		expect(row).toMatchObject({
			id,
			status: "pending",
			attempts: 0,
			sent_at: null,
		});
	});

	it("delivers a recorded intent and settles its row", async () => {
		const id = await db.transaction((tx) => recordReceiptIntent(tx, INTENT));

		await expect(deliverRecordedReceipt(id)).resolves.toBeUndefined();

		const [row] = await rows();
		expect(row?.status).toBe("sent");
		expect(row?.attempts).toBe(1);
		expect(row?.sent_at).not.toBeNull();
		await waitForAudit(id, 1);
		expect(await queuedJobCount(id)).toBe(1);
	});

	// The bug itself: the request commits, then dies before queuing anything.
	it("replays the receipt a dying request never queued", async () => {
		const id = await db.transaction((tx) => recordReceiptIntent(tx, INTENT));

		const result = await replayPendingReceipts({ now: laterBy(STALE) });

		expect(result).toEqual({ claimed: 1, sent: 1, failed: 0 });
		const [row] = await rows();
		expect(row?.status).toBe("sent");
		await waitForAudit(id, 1);
		expect(await queuedJobCount(id)).toBe(1);
	});

	it("leaves a row alone while its own request may still be finishing", async () => {
		await db.transaction((tx) => recordReceiptIntent(tx, INTENT));

		const result = await replayPendingReceipts({ now: new Date() });

		expect(result).toEqual({ claimed: 0, sent: 0, failed: 0 });
		expect((await rows())[0]?.status).toBe("pending");
	});

	it("claims nothing on a second pass over a settled row", async () => {
		const id = await db.transaction((tx) => recordReceiptIntent(tx, INTENT));
		await replayPendingReceipts({ now: laterBy(STALE) });

		const second = await replayPendingReceipts({ now: laterBy(2 * STALE) });

		expect(second).toEqual({ claimed: 0, sent: 0, failed: 0 });
		expect(await queuedJobCount(id)).toBe(1);
	});

	// The row id doubles as the pg-boss job id, so even a row wrongly reclaimed
	// — a process that died between `send` and the status write — cannot put a
	// second copy of the same acknowledgement in the queue.
	it("sends no second copy when a row whose job already left is reclaimed", async () => {
		const id = await db.transaction((tx) => recordReceiptIntent(tx, INTENT));
		await deliverReceiptIntent(id);
		await sql`
			UPDATE app_receipt_outbox
			SET status = 'sending', updated_at = NOW() - INTERVAL '1 day'
			WHERE id = ${id}
		`;

		const result = await replayPendingReceipts({ now: laterBy(STALE) });

		expect(result).toEqual({ claimed: 1, sent: 1, failed: 0 });
		expect(await queuedJobCount(id)).toBe(1);
		const [row] = await rows();
		expect(row?.status).toBe("sent");
	});

	it("delivers every owed receipt in one pass", async () => {
		const ids = await db.transaction(async (tx) => [
			await recordReceiptIntent(tx, INTENT),
			await recordReceiptIntent(tx, { ...INTENT, kind: "jointEvaluation" }),
		]);

		const result = await replayPendingReceipts({ now: laterBy(STALE) });

		expect(result).toEqual({ claimed: 2, sent: 2, failed: 0 });
		for (const id of ids) {
			expect(await queuedJobCount(id)).toBe(1);
		}
	});
});
