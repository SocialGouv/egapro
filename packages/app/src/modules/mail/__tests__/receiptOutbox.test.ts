import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	sendReceipt: vi.fn(),
	reportReceiptFailure: vi.fn().mockReturnValue("boom"),
	logAction: vi.fn(),
	claimed: [] as unknown[][],
	exhausted: [] as unknown[],
	candidates: [] as unknown[],
	settleCalls: [] as Record<string, unknown>[],
	settleWhereConditions: [] as SQL[],
	settleError: null as Error | null,
}));

vi.mock("../enqueueReceipt", () => ({
	sendReceipt: mocks.sendReceipt,
	reportReceiptFailure: mocks.reportReceiptFailure,
}));

vi.mock("~/server/audit/log", () => ({
	logAction: mocks.logAction,
}));

vi.mock("~/server/db", () => ({
	db: {
		// The claim and the settle share `update` — told apart by the status being written.
		update: () => ({
			set: (patch: Record<string, unknown>) => ({
				where: (condition: import("drizzle-orm").SQL) => {
					const isClaim = patch.status === "sending";
					const isExhaustion =
						patch.lastError ===
						"Maximum delivery attempts reached after interrupted delivery";
					if (!isClaim && !isExhaustion) {
						mocks.settleCalls.push(patch);
						mocks.settleWhereConditions.push(condition);
						if (mocks.settleError) return Promise.reject(mocks.settleError);
					}
					const statement = Promise.resolve(undefined) as Promise<undefined> & {
						returning: () => Promise<unknown[]>;
					};
					statement.returning = () =>
						Promise.resolve(
							isClaim
								? (mocks.claimed.shift() ?? [])
								: isExhaustion
									? mocks.exhausted
									: [],
						);
					return statement;
				},
			}),
		}),
		select: () => ({
			from: () => ({
				where: () => ({
					orderBy: () => ({
						limit: () => Promise.resolve(mocks.candidates),
					}),
				}),
			}),
		}),
	},
}));

import type { SQL } from "drizzle-orm";
import { and, eq } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { AUDIT_ACTIONS } from "~/modules/audit";
import { receiptOutbox } from "~/server/db/schema";
import {
	deliverReceiptIntent,
	RECEIPT_OUTBOX_MAX_ATTEMPTS,
	replayPendingReceipts,
} from "../receiptOutbox";

// Same casing as the app's db instance, so the generated column names match.
const dialect = new PgDialect({ casing: "snake_case" });

function outboxRow(overrides: Record<string, unknown> = {}) {
	return {
		id: "0f3f4d2e-1c2b-4a5e-9f11-2f9a8c7d6e5b",
		kind: "declaration",
		siren: "123456789",
		year: 2026,
		recipientEmail: "declarant@example.fr",
		userId: "user-1",
		status: "sending",
		attempts: 1,
		lastError: null,
		createdAt: new Date("2026-03-01T10:00:00.000Z"),
		updatedAt: new Date("2026-03-01T10:00:00.000Z"),
		sentAt: null,
		...overrides,
	};
}

describe("deliverReceiptIntent", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.claimed = [];
		mocks.exhausted = [];
		mocks.candidates = [];
		mocks.settleCalls = [];
		mocks.settleWhereConditions = [];
		mocks.sendReceipt.mockResolvedValue({
			sent: true,
			error: null,
			countsAsAttempt: true,
		});
	});

	it("renders and queues the claimed row, then marks it sent", async () => {
		mocks.claimed = [[outboxRow()]];

		const outcome = await deliverReceiptIntent(
			"0f3f4d2e-1c2b-4a5e-9f11-2f9a8c7d6e5b",
		);

		expect(outcome).toBe("sent");
		expect(mocks.sendReceipt).toHaveBeenCalledWith({
			kind: "declaration",
			to: "declarant@example.fr",
			siren: "123456789",
			year: 2026,
			userId: "user-1",
			isResend: false,
			outboxId: "0f3f4d2e-1c2b-4a5e-9f11-2f9a8c7d6e5b",
		});
		expect(mocks.settleCalls[0]).toMatchObject({
			status: "sent",
			lastError: null,
			sentAt: expect.any(Date),
		});
	});

	// The claim is the lock — an already-taken or already-sent row must not be rendered twice.
	it("does nothing when the row is no longer claimable", async () => {
		mocks.claimed = [[]];

		const outcome = await deliverReceiptIntent("already-taken");

		expect(outcome).toBe("skipped");
		expect(mocks.sendReceipt).not.toHaveBeenCalled();
		expect(mocks.settleCalls).toHaveLength(0);
	});

	it("puts a failed send back in the queue of owed receipts", async () => {
		mocks.claimed = [[outboxRow({ attempts: 2 })]];
		mocks.sendReceipt.mockResolvedValue({
			sent: false,
			error: "smtp timeout",
			countsAsAttempt: true,
		});

		const outcome = await deliverReceiptIntent("row-1");

		expect(outcome).toBe("failed");
		expect(mocks.settleCalls[0]).toMatchObject({
			status: "pending",
			lastError: "smtp timeout",
		});
		expect(mocks.settleCalls[0]).not.toHaveProperty("sentAt");
		expect(mocks.settleCalls[0]).not.toHaveProperty("attempts");
	});

	// A queue outage isn't fixable by retrying, so the claim is given back instead of spent.
	it("gives back the attempt when the queue was unreachable", async () => {
		mocks.claimed = [[outboxRow({ attempts: 2 })]];
		mocks.sendReceipt.mockResolvedValue({
			sent: false,
			error: "queue_unavailable",
			countsAsAttempt: false,
		});

		const outcome = await deliverReceiptIntent("row-1");

		expect(outcome).toBe("deferred");
		expect(mocks.settleCalls[0]).toMatchObject({
			status: "pending",
			attempts: 1,
			lastError: "queue_unavailable",
		});
		expect(mocks.settleCalls[0]).not.toHaveProperty("sentAt");
	});

	it("parks a row that has exhausted its attempts", async () => {
		mocks.claimed = [[outboxRow({ attempts: RECEIPT_OUTBOX_MAX_ATTEMPTS })]];
		mocks.sendReceipt.mockResolvedValue({
			sent: false,
			error: "boom",
			countsAsAttempt: true,
		});

		await deliverReceiptIntent("row-1");

		expect(mocks.settleCalls[0]).toMatchObject({
			status: "failed",
			lastError: "boom",
		});
	});

	// A receipt sent without its PDF still settles as sent, degradation noted on the row.
	it("keeps the degradation reason on a row that did go out", async () => {
		mocks.claimed = [[outboxRow()]];
		mocks.sendReceipt.mockResolvedValue({
			sent: true,
			error: "pdf render KO",
			countsAsAttempt: true,
		});

		await deliverReceiptIntent("row-1");

		expect(mocks.settleCalls[0]).toMatchObject({
			status: "sent",
			lastError: "pdf render KO",
		});
	});

	// A pass that outlived its claim must not overwrite whatever reclaimed the row meanwhile.
	it("settles only the row this pass still owns", async () => {
		const row = outboxRow({ attempts: 3 });
		mocks.claimed = [[row]];

		await deliverReceiptIntent(row.id);

		const expected = dialect.sqlToQuery(
			and(
				eq(receiptOutbox.id, row.id),
				eq(receiptOutbox.status, "sending"),
				eq(receiptOutbox.attempts, row.attempts),
			) as SQL,
		);
		expect(dialect.sqlToQuery(mocks.settleWhereConditions[0] as SQL)).toEqual(
			expected,
		);
	});
});

describe("replayPendingReceipts", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.claimed = [];
		mocks.exhausted = [];
		mocks.candidates = [];
		mocks.settleCalls = [];
		mocks.settleWhereConditions = [];
		mocks.settleError = null;
		mocks.sendReceipt.mockResolvedValue({
			sent: true,
			error: null,
			countsAsAttempt: true,
		});
		mocks.reportReceiptFailure.mockReturnValue("boom");
	});

	it("reports an empty pass and writes no audit row when nothing is owed", async () => {
		const result = await replayPendingReceipts();

		expect(result).toEqual({ claimed: 0, sent: 0, failed: 0 });
		expect(mocks.logAction).not.toHaveBeenCalled();
	});

	it("parks and reports stale rows that exhausted their attempts", async () => {
		mocks.exhausted = [{ id: "row-max" }];

		const result = await replayPendingReceipts();

		expect(result).toEqual({ claimed: 1, sent: 0, failed: 1 });
		expect(mocks.sendReceipt).not.toHaveBeenCalled();
		expect(mocks.reportReceiptFailure).toHaveBeenCalledWith(
			expect.objectContaining({
				message: "Maximum delivery attempts reached after interrupted delivery",
			}),
			{ stage: "replay", outboxId: "row-max" },
		);
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: AUDIT_ACTIONS.NOTIFICATION_OUTBOX_DELIVERY_FAILED,
				status: "failure",
				resourceId: "row-max",
			}),
		);
	});

	it("delivers every stale row and counts the outcomes", async () => {
		mocks.candidates = [{ id: "row-1" }, { id: "row-2" }];
		mocks.claimed = [
			[outboxRow({ id: "row-1" })],
			[outboxRow({ id: "row-2" })],
		];
		mocks.sendReceipt
			.mockResolvedValueOnce({ sent: true, error: null, countsAsAttempt: true })
			.mockResolvedValueOnce({
				sent: false,
				error: "boom",
				countsAsAttempt: true,
			});

		const result = await replayPendingReceipts();

		expect(result).toEqual({ claimed: 2, sent: 1, failed: 1 });
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: AUDIT_ACTIONS.NOTIFICATION_OUTBOX_REPLAY_BATCH,
				status: "failure",
				metadata: { claimed: 2, sent: 1, failed: 1 },
			}),
		);
	});

	it("audits a clean pass as a success", async () => {
		mocks.candidates = [{ id: "row-1" }];
		mocks.claimed = [[outboxRow({ id: "row-1" })]];

		await replayPendingReceipts();

		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({ status: "success" }),
		);
	});

	// A row another pass grabbed first is not this pass's work — must not be counted or audited.
	it("ignores a candidate that a concurrent pass already claimed", async () => {
		mocks.candidates = [{ id: "row-1" }];
		mocks.claimed = [[]];

		const result = await replayPendingReceipts();

		expect(result).toEqual({ claimed: 0, sent: 0, failed: 0 });
		expect(mocks.sendReceipt).not.toHaveBeenCalled();
		expect(mocks.logAction).not.toHaveBeenCalled();
	});

	// A deferred row made no progress — must not inflate `claimed` or trigger a batch audit.
	it("does not count a deferred row as claimed", async () => {
		mocks.candidates = [{ id: "row-1" }];
		mocks.claimed = [[outboxRow({ id: "row-1", attempts: 2 })]];
		mocks.sendReceipt.mockResolvedValue({
			sent: false,
			error: "queue_unavailable",
			countsAsAttempt: false,
		});

		const result = await replayPendingReceipts();

		expect(result).toEqual({ claimed: 0, sent: 0, failed: 0 });
		expect(mocks.logAction).not.toHaveBeenCalled();
	});

	// A DB error on one row must not abort the rest of the batch.
	it("keeps replaying the rest of the batch after one row's claim/settle throws", async () => {
		mocks.candidates = [{ id: "row-1" }, { id: "row-2" }];
		mocks.claimed = [
			[outboxRow({ id: "row-1" })],
			[outboxRow({ id: "row-2" })],
		];
		mocks.settleError = new Error("connection terminated");
		mocks.reportReceiptFailure.mockReturnValue("connection terminated");

		const result = await replayPendingReceipts();

		expect(result).toEqual({ claimed: 2, sent: 0, failed: 2 });
		expect(mocks.reportReceiptFailure).toHaveBeenCalledWith(expect.any(Error), {
			stage: "replay",
			outboxId: "row-1",
		});
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: AUDIT_ACTIONS.NOTIFICATION_OUTBOX_DELIVERY_FAILED,
				status: "failure",
				resourceType: "receipt_outbox",
				resourceId: "row-1",
				errorMessage: "connection terminated",
				metadata: { stage: "replay" },
			}),
		);
		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: AUDIT_ACTIONS.NOTIFICATION_OUTBOX_REPLAY_BATCH,
				status: "failure",
				metadata: { claimed: 2, sent: 0, failed: 2 },
			}),
		);
	});
});
