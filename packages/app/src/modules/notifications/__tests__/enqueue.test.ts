import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockLogAction, mockGetBoss, mockBossSend } = vi.hoisted(() => ({
	mockLogAction: vi.fn(),
	mockGetBoss: vi.fn(),
	mockBossSend: vi.fn(),
}));

vi.mock("~/server/audit/log", () => ({
	logAction: mockLogAction,
}));

vi.mock("../boss", () => ({
	NOTIFICATION_QUEUE_NAME: "email-notification",
	getBoss: mockGetBoss,
}));

vi.mock("~/env", () => ({
	env: {
		NOTIFICATIONS_RETRY_LIMIT: 5,
		NOTIFICATIONS_RETRY_DELAY_SECONDS: 60,
	},
}));

import { enqueueNotification } from "../enqueue";

describe("enqueueNotification — graceful degradation", () => {
	beforeEach(() => {
		mockLogAction.mockReset();
		mockGetBoss.mockReset();
		mockBossSend.mockReset();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("returns queue_unavailable when the boss singleton resolves to null", async () => {
		mockGetBoss.mockResolvedValue(null);

		const result = await enqueueNotification({
			type: "cse_opinion_submitted",
			recipientEmail: "user@example.fr",
			recipientUserId: null,
			siren: "552100554",
			payload: { siren: "552100554", year: 2025 },
		});

		expect(result).toEqual({ status: "queue_unavailable" });
		expect(mockBossSend).not.toHaveBeenCalled();
		expect(mockLogAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "notification.enqueue",
				status: "failure",
			}),
		);
	});

	it("returns error when boss.send throws (DB outage mid-call)", async () => {
		mockGetBoss.mockResolvedValue({
			send: mockBossSend.mockRejectedValue(new Error("ECONNREFUSED")),
		});

		const result = await enqueueNotification({
			type: "cse_opinion_submitted",
			recipientEmail: "user@example.fr",
			recipientUserId: null,
			siren: "552100554",
			payload: { siren: "552100554", year: 2025 },
		});

		expect(result.status).toBe("error");
		if (result.status === "error") {
			expect(result.error).toContain("ECONNREFUSED");
		}
		expect(mockLogAction).toHaveBeenCalledWith(
			expect.objectContaining({
				action: "notification.enqueue",
				status: "failure",
			}),
		);
	});

	it("returns enqueued with the job id on happy path", async () => {
		mockBossSend.mockResolvedValue("job-abc-123");
		mockGetBoss.mockResolvedValue({ send: mockBossSend });

		const result = await enqueueNotification({
			type: "joint_evaluation_submitted",
			recipientEmail: "user@example.fr",
			recipientUserId: "user-id",
			siren: "552100554",
			payload: { siren: "552100554", year: 2025 },
		});

		expect(result).toEqual({ status: "enqueued", id: "job-abc-123" });
		expect(mockBossSend).toHaveBeenCalledWith(
			"email-notification",
			expect.objectContaining({ type: "joint_evaluation_submitted" }),
			expect.objectContaining({
				retryLimit: 5,
				retryBackoff: true,
				retryDelay: 60,
			}),
		);
	});
});
