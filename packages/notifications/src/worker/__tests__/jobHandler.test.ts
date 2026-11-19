import type { JobWithMetadata } from "pg-boss";
import type { Transporter } from "nodemailer";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { audit, buildMail, captureJobFailure } = vi.hoisted(() => ({
	audit: vi.fn(),
	buildMail: vi.fn(),
	captureJobFailure: vi.fn(),
}));

vi.mock("../auditLog.js", () => ({ logAuditMain: audit }));
vi.mock("../sentry.js", () => ({ captureJobFailure }));
vi.mock("../../mails/index.js", async (importOriginal) => ({
	...(await importOriginal<object>()),
	buildMail,
}));

import { makeJobHandler } from "../jobHandler.js";

const validData = {
	type: "joint_evaluation_submitted",
	payload: {
		siren: "552100554",
		year: 2025,
		variant: "completed",
		raisonSociale: "Société Démo",
	},
	recipientEmail: "rh@example.fr",
	recipientUserId: "user-1",
	siren: "552100554",
};

const job = (data: unknown, retryCount = 0, retryLimit = 5) =>
	({ id: "job-1", data, retryCount, retryLimit }) as JobWithMetadata<unknown>;

describe("makeJobHandler audit", () => {
	beforeEach(() => {
		audit.mockReset().mockResolvedValue(undefined);
		buildMail.mockReset().mockResolvedValue({
			subject: "Subject",
			html: "<p>Body</p>",
			text: "Body",
		});
		captureJobFailure.mockReset();
	});

	it("records success without email or provider id", async () => {
		const sendMail = vi.fn().mockResolvedValue({ messageId: "provider-1" });
		const handler = makeJobHandler({
			transporter: { sendMail } as unknown as Transporter,
			mailFrom: "from@example.fr",
			mailEnabled: true,
			mainSql: {} as never,
		});
		await handler(job(validData, 1));
		expect(sendMail).toHaveBeenCalledOnce();
		expect(audit).toHaveBeenCalledWith(expect.anything(), {
			status: "success",
			userId: "user-1",
			siren: "552100554",
			resourceId: "job-1",
			metadata: { type: "joint_evaluation_submitted", attempt: 2 },
		});
	});

	it("records a stable transport code and preserves the retry error", async () => {
		const error = new Error("transport failed for rh@example.fr");
		const sendMail = vi.fn().mockRejectedValue(error);
		const handler = makeJobHandler({
			transporter: { sendMail } as unknown as Transporter,
			mailFrom: "from@example.fr",
			mailEnabled: true,
			mainSql: {} as never,
		});
		await expect(handler(job(validData))).rejects.toBe(error);
		expect(audit).toHaveBeenCalledWith(expect.anything(), {
			status: "failure",
			userId: "user-1",
			siren: "552100554",
			resourceId: "job-1",
			errorCode: "mail_transport_failed",
			metadata: { type: "joint_evaluation_submitted", attempt: 1 },
		});
	});

	it("records an invalid job and completes without retrying", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const handler = makeJobHandler({
			transporter: null,
			mailFrom: "from@example.fr",
			mailEnabled: false,
			mainSql: {} as never,
		});
		await expect(
			handler(job({ ...validData, type: "rh@example.fr" })),
		).resolves.toBeUndefined();
		expect(audit).toHaveBeenCalledWith(expect.anything(), {
			status: "failure",
			userId: "user-1",
			siren: "552100554",
			resourceId: "job-1",
			errorCode: "invalid_job",
			metadata: { attempt: 1, poisonPill: true },
		});
		expect(consoleSpy.mock.calls[0]?.[0]).not.toContain("rh@example.fr");
		consoleSpy.mockRestore();
	});

	it("records a rendering code without changing the thrown error", async () => {
		const error = new Error("render failed for rh@example.fr");
		buildMail.mockRejectedValue(error);
		const handler = makeJobHandler({
			transporter: null,
			mailFrom: "from@example.fr",
			mailEnabled: false,
			mainSql: {} as never,
		});
		await expect(handler(job(validData))).rejects.toBe(error);
		expect(audit.mock.calls[0]?.[1]).toMatchObject({
			status: "failure",
			errorCode: "mail_render_failed",
		});
	});

	it("retains a null user and SIREN without inventing identifiers", async () => {
		const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		const handler = makeJobHandler({
			transporter: null,
			mailFrom: "from@example.fr",
			mailEnabled: false,
			mainSql: {} as never,
		});
		await handler(job({ ...validData, recipientUserId: null, siren: null }));
		expect(audit.mock.calls[0]?.[1]).toMatchObject({
			status: "success",
			userId: null,
			siren: null,
		});
		consoleSpy.mockRestore();
	});
});

describe("makeJobHandler Sentry reporting", () => {
	beforeEach(() => {
		audit.mockReset().mockResolvedValue(undefined);
		buildMail.mockReset().mockResolvedValue({
			subject: "Subject",
			html: "<p>Body</p>",
			text: "Body",
		});
		captureJobFailure.mockReset();
	});

	function transportHandler(error: unknown) {
		return makeJobHandler({
			transporter: {
				sendMail: vi.fn().mockRejectedValue(error),
			} as unknown as Transporter,
			mailFrom: "no-reply@example.test",
			mailEnabled: true,
			mainSql: {} as never,
		});
	}

	it("stays silent on an attempt pg-boss will retry", async () => {
		const handler = transportHandler(new Error("relay hiccup"));

		await expect(handler(job(validData, 0, 5))).rejects.toThrow("relay");

		// One issue per retry would bury a transient SMTP outage under its own
		// duplicates.
		expect(captureJobFailure).not.toHaveBeenCalled();
	});

	it("reports the last transport attempt, when the mail is lost", async () => {
		const error = new Error("relay is gone");
		const handler = transportHandler(error);

		await expect(handler(job(validData, 5, 5))).rejects.toThrow("relay");

		expect(captureJobFailure).toHaveBeenCalledWith(error, {
			attempt: 6,
			type: "joint_evaluation_submitted",
			phase: "transport",
		});
	});

	it("reports a render failure with its own phase", async () => {
		const error = new Error("template exploded");
		buildMail.mockRejectedValue(error);
		const handler = makeJobHandler({
			transporter: null,
			mailFrom: "no-reply@example.test",
			mailEnabled: false,
			mainSql: {} as never,
		});

		await expect(handler(job(validData, 5, 5))).rejects.toBe(error);

		expect(captureJobFailure).toHaveBeenCalledWith(
			error,
			expect.objectContaining({ phase: "render", attempt: 6 }),
		);
	});

	it("reports nothing for a poison pill, which never retries", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const handler = makeJobHandler({
			transporter: null,
			mailFrom: "no-reply@example.test",
			mailEnabled: false,
			mainSql: {} as never,
		});

		await handler(job({ ...validData, type: "unknown_type" }, 5, 5));

		// Malformed payloads are already logged with their bounded code; they
		// are a content bug, not a dependency outage.
		expect(captureJobFailure).not.toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it("reports nothing when the mail goes out", async () => {
		const handler = makeJobHandler({
			transporter: {
				sendMail: vi.fn().mockResolvedValue({ messageId: "provider-1" }),
			} as unknown as Transporter,
			mailFrom: "no-reply@example.test",
			mailEnabled: true,
			mainSql: {} as never,
		});

		await handler(job(validData, 5, 5));

		expect(captureJobFailure).not.toHaveBeenCalled();
	});
});
