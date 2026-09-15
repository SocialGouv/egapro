import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	sendReceipt: vi.fn(),
	reportReceiptFailure: vi.fn().mockReturnValue("boom"),
	logAction: vi.fn(),
	claimed: [] as unknown[][],
	candidates: [] as unknown[],
	settleCalls: [] as Record<string, unknown>[],
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
		// `update` serves two different statements: the claim, which moves a row
		// to `sending` and reads it back, and the settle, which writes the final
		// status. They are told apart by the status being written, so a settle
		// never consumes the rows queued for the next claim.
		update: () => ({
			set: (patch: Record<string, unknown>) => ({
				where: () => {
					const isClaim = patch.status === "sending";
					if (!isClaim) {
						mocks.settleCalls.push(patch);
						if (mocks.settleError) return Promise.reject(mocks.settleError);
					}
					const statement = Promise.resolve(undefined) as Promise<undefined> & {
						returning: () => Promise<unknown[]>;
					};
					statement.returning = () =>
						Promise.resolve(isClaim ? (mocks.claimed.shift() ?? []) : []);
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

import { AUDIT_ACTIONS } from "~/modules/audit";
import {
	deliverReceiptIntent,
	RECEIPT_OUTBOX_MAX_ATTEMPTS,
	replayPendingReceipts,
} from "../receiptOutbox";

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
		mocks.candidates = [];
		mocks.settleCalls = [];
		mocks.sendReceipt.mockResolvedValue({ sent: true, error: null });
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

	// The claim is the lock: a row already taken by the retry pass (or already
	// sent) must not be rendered a second time.
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
			error: "queue_unavailable",
		});

		const outcome = await deliverReceiptIntent("row-1");

		expect(outcome).toBe("failed");
		expect(mocks.settleCalls[0]).toMatchObject({
			status: "pending",
			lastError: "queue_unavailable",
		});
		expect(mocks.settleCalls[0]).not.toHaveProperty("sentAt");
	});

	it("parks a row that has exhausted its attempts", async () => {
		mocks.claimed = [[outboxRow({ attempts: RECEIPT_OUTBOX_MAX_ATTEMPTS })]];
		mocks.sendReceipt.mockResolvedValue({ sent: false, error: "boom" });

		await deliverReceiptIntent("row-1");

		expect(mocks.settleCalls[0]).toMatchObject({
			status: "failed",
			lastError: "boom",
		});
	});

	// A receipt that left without its PDF is still a receipt: the row settles as
	// sent, but the reason it went out degraded stays readable on it.
	it("keeps the degradation reason on a row that did go out", async () => {
		mocks.claimed = [[outboxRow()]];
		mocks.sendReceipt.mockResolvedValue({ sent: true, error: "pdf render KO" });

		await deliverReceiptIntent("row-1");

		expect(mocks.settleCalls[0]).toMatchObject({
			status: "sent",
			lastError: "pdf render KO",
		});
	});
});

describe("replayPendingReceipts", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.claimed = [];
		mocks.candidates = [];
		mocks.settleCalls = [];
		mocks.settleError = null;
		mocks.sendReceipt.mockResolvedValue({ sent: true, error: null });
		mocks.reportReceiptFailure.mockReturnValue("boom");
	});

	it("reports an empty pass and writes no audit row when nothing is owed", async () => {
		const result = await replayPendingReceipts();

		expect(result).toEqual({ claimed: 0, sent: 0, failed: 0 });
		expect(mocks.logAction).not.toHaveBeenCalled();
	});

	it("delivers every stale row and counts the outcomes", async () => {
		mocks.candidates = [{ id: "row-1" }, { id: "row-2" }];
		mocks.claimed = [
			[outboxRow({ id: "row-1" })],
			[outboxRow({ id: "row-2" })],
		];
		mocks.sendReceipt
			.mockResolvedValueOnce({ sent: true, error: null })
			.mockResolvedValueOnce({ sent: false, error: "boom" });

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

	// A row another pass grabbed first is not this pass's work, and must not be
	// counted — nor audited as if a receipt had moved.
	it("ignores a candidate that a concurrent pass already claimed", async () => {
		mocks.candidates = [{ id: "row-1" }];
		mocks.claimed = [[]];

		const result = await replayPendingReceipts();

		expect(result).toEqual({ claimed: 0, sent: 0, failed: 0 });
		expect(mocks.sendReceipt).not.toHaveBeenCalled();
		expect(mocks.logAction).not.toHaveBeenCalled();
	});

	// A DB error on one row's claim/settle (connection drop, pool timeout) must
	// not abort the rest of the batch — it is counted like any other failure,
	// reported to Sentry/console, and given its own audit row, then the pass
	// moves on to the next candidate.
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
