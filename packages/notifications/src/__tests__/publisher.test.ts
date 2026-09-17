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

import {
	__resetPublisherForTests,
	enqueueNotification,
	isPublisherAvailable,
} from "../publisher.js";

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
		// Also clear the main-DB fallback vars so "queue_unavailable" stays
		// the deterministic outcome when no NOTIFICATIONS_* config is set.
		delete process.env.DATABASE_URL;
		delete process.env.POSTGRES_HOST;
		delete process.env.POSTGRES_DB;
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("returns queue_unavailable when no connection string is configured", async () => {
		const result = await enqueueNotification(BASE_INPUT);
		expect(result).toEqual({ status: "queue_unavailable" });
		expect(mockSend).not.toHaveBeenCalled();
	});

	it("reports unavailable with no connection string, without calling send", async () => {
		const available = await isPublisherAvailable();
		expect(available).toBe(false);
		expect(mockSend).not.toHaveBeenCalled();
	});

	it("reports available once the publisher starts, from the same cache enqueueNotification uses", async () => {
		process.env.NOTIFICATIONS_DATABASE_URL =
			"postgres://user:pwd@localhost:5432/db";
		mockStart.mockResolvedValue(undefined);
		mockCreateQueue.mockResolvedValue(undefined);

		const available = await isPublisherAvailable();

		expect(available).toBe(true);
		expect(mockStart).toHaveBeenCalledTimes(1);
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

describe("enqueueNotification — job id deduplication", () => {
	beforeEach(() => {
		__resetPublisherForTests();
		mockSend.mockReset();
		mockStart.mockReset().mockResolvedValue(undefined);
		mockCreateQueue.mockReset().mockResolvedValue(undefined);
		mockOn.mockReset();
		process.env.NOTIFICATIONS_DATABASE_URL =
			"postgres://user:pwd@localhost:5432/db";
	});

	afterEach(() => {
		delete process.env.NOTIFICATIONS_DATABASE_URL;
		vi.clearAllMocks();
	});

	const JOB_ID = "0f3f4d2e-1c2b-4a5e-9f11-2f9a8c7d6e5b";

	it("passes the caller's job id to pg-boss as the row id", async () => {
		mockSend.mockResolvedValue(JOB_ID);

		const result = await enqueueNotification({ ...BASE_INPUT, jobId: JOB_ID });

		expect(result).toEqual({ status: "enqueued", id: JOB_ID });
		expect(mockSend).toHaveBeenCalledWith(
			expect.any(String),
			expect.any(Object),
			expect.objectContaining({ id: JOB_ID }),
		);
	});

	it("sends no id at all when the caller gives none", async () => {
		mockSend.mockResolvedValue("generated-id");

		await enqueueNotification(BASE_INPUT);

		const options = mockSend.mock.calls[0]?.[2] as Record<string, unknown>;
		expect(options).not.toHaveProperty("id");
	});

	// A replay of a receipt whose first attempt did reach the queue must not
	// produce a second e-mail (issue #4542): the duplicate key is the proof the
	// job is already there, not a failure to report.
	it("reports a duplicate when the id is already taken", async () => {
		mockSend.mockRejectedValue(
			Object.assign(new Error("duplicate key value"), { code: "23505" }),
		);

		const result = await enqueueNotification({ ...BASE_INPUT, jobId: JOB_ID });

		expect(result).toEqual({ status: "duplicate", id: JOB_ID });
	});

	it("reports a duplicate when the queue policy refuses the id", async () => {
		mockSend.mockResolvedValue(null);

		const result = await enqueueNotification({ ...BASE_INPUT, jobId: JOB_ID });

		expect(result).toEqual({ status: "duplicate", id: JOB_ID });
	});

	it("still reports an error for a non-duplicate failure", async () => {
		mockSend.mockRejectedValue(
			Object.assign(new Error("deadlock detected"), { code: "40P01" }),
		);

		const result = await enqueueNotification({ ...BASE_INPUT, jobId: JOB_ID });

		expect(result).toEqual({ status: "error", error: "deadlock detected" });
	});

	it("keeps an unidentified send that resolves to null an enqueue", async () => {
		mockSend.mockResolvedValue(null);

		const result = await enqueueNotification(BASE_INPUT);

		expect(result).toEqual({ status: "enqueued", id: "" });
	});
});
