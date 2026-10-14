import type { JobWithMetadata } from "pg-boss";
import type { Transporter } from "nodemailer";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { audit, buildMail } = vi.hoisted(() => ({
	audit: vi.fn(),
	buildMail: vi.fn(),
}));

vi.mock("../auditLog.js", () => ({ logAuditMain: audit }));
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

const job = (data: unknown, retryCount = 0) =>
	({ id: "job-1", data, retryCount }) as JobWithMetadata<unknown>;

describe("makeJobHandler audit", () => {
	beforeEach(() => {
		audit.mockReset().mockResolvedValue(undefined);
		buildMail.mockReset().mockResolvedValue({
			subject: "Subject",
			html: "<p>Body</p>",
			text: "Body",
		});
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
