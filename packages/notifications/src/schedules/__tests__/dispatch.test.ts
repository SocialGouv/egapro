import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockEnqueue, mockMarkSent, mockWasSent } = vi.hoisted(() => ({
	mockEnqueue: vi.fn(),
	mockMarkSent: vi.fn(),
	mockWasSent: vi.fn(),
}));

vi.mock("../../publisher.js", () => ({
	enqueueNotification: mockEnqueue,
}));

vi.mock("../../eligibility/index.js", () => ({
	markSent: mockMarkSent,
	wasSent: mockWasSent,
}));

import { dispatchReminder } from "../dispatch.js";

const recipient = (siren: string) => ({
	siren,
	year: 2027,
	email: `user-${siren}@example.fr`,
	userId: `user-${siren}`,
});

const fakeSql = {} as unknown as Parameters<typeof dispatchReminder>[0]["sql"];

describe("dispatchReminder", () => {
	beforeEach(() => {
		mockEnqueue.mockReset();
		mockMarkSent.mockReset();
		mockWasSent.mockReset();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("enqueues a job for each new recipient and marks them sent", async () => {
		mockWasSent.mockResolvedValue(false);
		mockEnqueue.mockResolvedValue({ status: "enqueued", id: "job-1" });
		mockMarkSent.mockResolvedValue(undefined);

		const result = await dispatchReminder({
			sql: fakeSql,
			type: "cycle_opening_info",
			recipients: [recipient("111111111"), recipient("222222222")],
			payloadFor: ({ siren }) => ({
				siren,
				year: 2027,
				deadline: "2027-06-01T00:00:00.000Z",
			}),
		});

		expect(result).toEqual({
			scheduled: 2,
			skippedAlreadySent: 0,
			enqueued: 2,
			enqueueErrors: 0,
		});
		expect(mockEnqueue).toHaveBeenCalledTimes(2);
		expect(mockMarkSent).toHaveBeenCalledTimes(2);
	});

	it("skips recipients already in the dedup table", async () => {
		mockWasSent.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
		mockEnqueue.mockResolvedValue({ status: "enqueued", id: "job-2" });
		mockMarkSent.mockResolvedValue(undefined);

		const result = await dispatchReminder({
			sql: fakeSql,
			type: "joint_evaluation_reminder",
			recipients: [recipient("111111111"), recipient("222222222")],
			payloadFor: ({ siren }) => ({
				siren,
				year: 2027,
				deadline: "2027-09-01T00:00:00.000Z",
			}),
		});

		expect(result.skippedAlreadySent).toBe(1);
		expect(result.enqueued).toBe(1);
		expect(mockEnqueue).toHaveBeenCalledTimes(1);
		expect(mockMarkSent).toHaveBeenCalledTimes(1);
	});

	it("does not mark sent if enqueue fails (so the next tick retries)", async () => {
		mockWasSent.mockResolvedValue(false);
		mockEnqueue.mockResolvedValue({ status: "error", error: "boom" });
		const errorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => undefined);

		const result = await dispatchReminder({
			sql: fakeSql,
			type: "compliance_path_choice_reminder",
			recipients: [recipient("111111111")],
			payloadFor: ({ siren }) => ({
				siren,
				year: 2027,
				deadline: "2027-07-01T00:00:00.000Z",
			}),
		});

		expect(result.enqueueErrors).toBe(1);
		expect(result.enqueued).toBe(0);
		expect(mockMarkSent).not.toHaveBeenCalled();
		errorSpy.mockRestore();
	});

	it("propagates the variant to dedup keys", async () => {
		mockWasSent.mockResolvedValue(false);
		mockEnqueue.mockResolvedValue({ status: "enqueued", id: "job-3" });
		mockMarkSent.mockResolvedValue(undefined);

		await dispatchReminder({
			sql: fakeSql,
			type: "cse_opinion_reminder",
			variant: "justify_oct",
			recipients: [recipient("111111111")],
			payloadFor: ({ siren }) => ({
				siren,
				year: 2027,
				deadline: "2027-10-01T00:00:00.000Z",
				variant: "justify_oct",
			}),
		});

		expect(mockWasSent).toHaveBeenCalledWith(
			fakeSql,
			expect.objectContaining({ variant: "justify_oct" }),
		);
		expect(mockMarkSent).toHaveBeenCalledWith(
			fakeSql,
			expect.objectContaining({ variant: "justify_oct" }),
		);
	});
});
