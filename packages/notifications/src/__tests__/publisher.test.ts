import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockSend, mockStart, mockCreateQueue, mockOn } = vi.hoisted(() => ({
	mockSend: vi.fn(),
	mockStart: vi.fn(),
	mockCreateQueue: vi.fn(),
	mockOn: vi.fn(),
}));

vi.mock("pg-boss", () => ({
	PgBoss: class {
		send = mockSend;
		start = mockStart;
		createQueue = mockCreateQueue;
		on = mockOn;
	},
}));

import { __resetPublisherForTests, enqueueNotification } from "../publisher.js";

const BASE_INPUT = {
	type: "joint_evaluation_submitted" as const,
	recipientEmail: "user@example.fr",
	recipientUserId: "user-1",
	siren: "552100554",
	payload: { siren: "552100554", year: 2025 },
};

describe("enqueueNotification — graceful degradation", () => {
	beforeEach(() => {
		__resetPublisherForTests();
		mockSend.mockReset();
		mockStart.mockReset();
		mockCreateQueue.mockReset();
		mockOn.mockReset();
		delete process.env.NOTIFICATIONS_DATABASE_URL;
		delete process.env.NOTIFICATIONS_POSTGRES_HOST;
		delete process.env.NOTIFICATIONS_POSTGRES_DB;
		delete process.env.NOTIFICATIONS_RETRY_LIMIT;
		delete process.env.NOTIFICATIONS_RETRY_DELAY_SECONDS;
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("returns queue_unavailable when no connection string is configured", async () => {
		const result = await enqueueNotification(BASE_INPUT);
		expect(result).toEqual({ status: "queue_unavailable" });
		expect(mockSend).not.toHaveBeenCalled();
	});

	it("returns error when boss.send throws (DB outage mid-call)", async () => {
		process.env.NOTIFICATIONS_DATABASE_URL =
			"postgres://user:pwd@localhost:5432/db";
		mockStart.mockResolvedValue(undefined);
		mockCreateQueue.mockResolvedValue(undefined);
		mockSend.mockRejectedValue(new Error("ECONNREFUSED"));

		const result = await enqueueNotification(BASE_INPUT);

		expect(result.status).toBe("error");
		if (result.status === "error") {
			expect(result.error).toContain("ECONNREFUSED");
		}
	});

	it("returns enqueued with the job id on happy path", async () => {
		process.env.NOTIFICATIONS_DATABASE_URL =
			"postgres://user:pwd@localhost:5432/db";
		process.env.NOTIFICATIONS_RETRY_LIMIT = "7";
		process.env.NOTIFICATIONS_RETRY_DELAY_SECONDS = "30";
		mockStart.mockResolvedValue(undefined);
		mockCreateQueue.mockResolvedValue(undefined);
		mockSend.mockResolvedValue("job-abc-123");

		const result = await enqueueNotification(BASE_INPUT);

		expect(result).toEqual({ status: "enqueued", id: "job-abc-123" });
		expect(mockSend).toHaveBeenCalledWith(
			"email-notification",
			expect.objectContaining({ type: "joint_evaluation_submitted" }),
			expect.objectContaining({
				retryLimit: 7,
				retryBackoff: true,
				retryDelay: 30,
			}),
		);
	});

	it("applies default retry settings when env vars are absent", async () => {
		process.env.NOTIFICATIONS_DATABASE_URL =
			"postgres://user:pwd@localhost:5432/db";
		mockStart.mockResolvedValue(undefined);
		mockCreateQueue.mockResolvedValue(undefined);
		mockSend.mockResolvedValue("job-1");

		await enqueueNotification(BASE_INPUT);

		expect(mockSend).toHaveBeenCalledWith(
			"email-notification",
			expect.anything(),
			expect.objectContaining({
				retryLimit: 5,
				retryDelay: 60,
			}),
		);
	});

	it("computes startAfter from scheduledFor", async () => {
		process.env.NOTIFICATIONS_DATABASE_URL =
			"postgres://user:pwd@localhost:5432/db";
		mockStart.mockResolvedValue(undefined);
		mockCreateQueue.mockResolvedValue(undefined);
		mockSend.mockResolvedValue("job-1");

		const inOneMinute = new Date(Date.now() + 60_000);
		await enqueueNotification({ ...BASE_INPUT, scheduledFor: inOneMinute });

		const callArgs = mockSend.mock.calls[0]?.[2] as { startAfter: number };
		expect(callArgs.startAfter).toBeGreaterThanOrEqual(55);
		expect(callArgs.startAfter).toBeLessThanOrEqual(60);
	});

	it("serialises attachments to base64 in the job payload", async () => {
		process.env.NOTIFICATIONS_DATABASE_URL =
			"postgres://user:pwd@localhost:5432/db";
		mockStart.mockResolvedValue(undefined);
		mockCreateQueue.mockResolvedValue(undefined);
		mockSend.mockResolvedValue("job-1");

		await enqueueNotification({
			...BASE_INPUT,
			attachments: [
				{
					filename: "receipt.pdf",
					content: Buffer.from("Hello PDF"),
					contentType: "application/pdf",
				},
			],
		});

		const jobData = mockSend.mock.calls[0]?.[1] as {
			attachments?: Array<{
				filename: string;
				contentBase64: string;
				contentType: string;
			}>;
		};
		expect(jobData.attachments).toHaveLength(1);
		expect(jobData.attachments?.[0]?.filename).toBe("receipt.pdf");
		expect(
			Buffer.from(
				jobData.attachments?.[0]?.contentBase64 ?? "",
				"base64",
			).toString(),
		).toBe("Hello PDF");
		expect(jobData.attachments?.[0]?.contentType).toBe("application/pdf");
	});

	it("omits attachments key when none provided", async () => {
		process.env.NOTIFICATIONS_DATABASE_URL =
			"postgres://user:pwd@localhost:5432/db";
		mockStart.mockResolvedValue(undefined);
		mockCreateQueue.mockResolvedValue(undefined);
		mockSend.mockResolvedValue("job-1");

		await enqueueNotification(BASE_INPUT);

		const jobData = mockSend.mock.calls[0]?.[1] as Record<string, unknown>;
		expect(Object.hasOwn(jobData, "attachments")).toBe(false);
	});
});
