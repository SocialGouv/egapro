import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	deliverReceiptIntent: vi.fn().mockResolvedValue("sent"),
	reportReceiptFailure: vi.fn().mockReturnValue("connection terminated"),
	logAction: vi.fn(),
}));

vi.mock("../receiptOutbox", () => ({
	deliverReceiptIntent: mocks.deliverReceiptIntent,
}));

vi.mock("../enqueueReceipt", () => ({
	reportReceiptFailure: mocks.reportReceiptFailure,
}));

vi.mock("~/server/audit/log", () => ({
	logAction: mocks.logAction,
}));

import { AUDIT_ACTIONS } from "~/modules/audit";
import { receiptOutbox } from "~/server/db/schema";
import { deliverRecordedReceipt, recordReceiptIntent } from "../receiptIntent";

const INTENT = {
	kind: "declaration" as const,
	to: "declarant@example.fr",
	siren: "123456789",
	year: 2026,
	userId: "user-1",
};

function createWriter() {
	const values = vi.fn().mockResolvedValue(undefined);
	const insert = vi.fn().mockReturnValue({ values });
	const rollback = vi.fn(() => {
		throw new Error("rollback");
	});
	return { insert, values, rollback };
}

describe("recordReceiptIntent", () => {
	it("writes the owed receipt through the handle it is given", async () => {
		const writer = createWriter();

		const id = await recordReceiptIntent(writer, INTENT);

		expect(writer.insert).toHaveBeenCalledWith(receiptOutbox);
		expect(writer.values).toHaveBeenCalledWith({
			id,
			kind: "declaration",
			siren: "123456789",
			year: 2026,
			recipientEmail: "declarant@example.fr",
			userId: "user-1",
		});
	});

	it("returns a fresh id per intent, so two receipts never share a queue slot", async () => {
		const writer = createWriter();

		const first = await recordReceiptIntent(writer, INTENT);
		const second = await recordReceiptIntent(writer, INTENT);

		expect(first).not.toBe(second);
		expect(first).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
		);
	});

	it("accepts an account with no user id", async () => {
		const writer = createWriter();

		await recordReceiptIntent(writer, { ...INTENT, userId: null });

		expect(writer.values).toHaveBeenCalledWith(
			expect.objectContaining({ userId: null }),
		);
	});
});

describe("deliverRecordedReceipt", () => {
	it("does nothing when no intent was recorded", async () => {
		mocks.deliverReceiptIntent.mockClear();

		await deliverRecordedReceipt(null);

		expect(mocks.deliverReceiptIntent).not.toHaveBeenCalled();
	});

	it("hands a recorded intent to the delivery path", async () => {
		mocks.deliverReceiptIntent.mockClear();

		await deliverRecordedReceipt("outbox-42");

		expect(mocks.deliverReceiptIntent).toHaveBeenCalledWith("outbox-42");
	});

	it("does not propagate an outbox failure to the caller", async () => {
		mocks.deliverReceiptIntent.mockClear();
		mocks.reportReceiptFailure.mockClear();
		mocks.logAction.mockClear();
		const dbError = new Error("connection terminated");
		mocks.deliverReceiptIntent.mockRejectedValueOnce(dbError);

		await expect(deliverRecordedReceipt("outbox-42")).resolves.toBeUndefined();

		expect(mocks.reportReceiptFailure).toHaveBeenCalledWith(dbError, {
			stage: "delivery",
			outboxId: "outbox-42",
		});
	});

	it("writes a dedicated failure audit row instead of the swallowed exception", async () => {
		mocks.deliverReceiptIntent.mockClear();
		mocks.reportReceiptFailure.mockClear();
		mocks.logAction.mockClear();
		mocks.deliverReceiptIntent.mockRejectedValueOnce(
			new Error("connection terminated"),
		);

		await deliverRecordedReceipt("outbox-42");

		expect(mocks.logAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: AUDIT_ACTIONS.NOTIFICATION_OUTBOX_DELIVERY_FAILED,
				status: "failure",
				resourceType: "receipt_outbox",
				resourceId: "outbox-42",
				errorMessage: "connection terminated",
				metadata: { stage: "delivery" },
			}),
		);
	});
});
