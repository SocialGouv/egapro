import type { Transporter } from "nodemailer";
import { describe, expect, it } from "vitest";

import { createSmtpProbe, createSmtpTransporter } from "../smtp.js";

function fakeTransporter(verify: () => Promise<boolean>): Transporter {
	return { verify } as unknown as Transporter;
}

describe("smtp probe", () => {
	it("declares itself as an important internal probe", () => {
		const probe = createSmtpProbe({
			transporter: fakeTransporter(async () => true),
			secrets: [],
		});

		expect(probe).toMatchObject({
			key: "smtp",
			label: "SMTP (envoi des e-mails)",
			criticality: "important",
			kind: "internal",
			intervalSeconds: 60,
			timeoutMs: 10_000,
		});
	});

	it("is operational when the server verifies", async () => {
		const result = await createSmtpProbe({
			transporter: fakeTransporter(async () => true),
			secrets: [],
		}).probe(new AbortController().signal);

		expect(result.status).toBe("operational");
		expect(result.message).toBeUndefined();
	});

	it("is unavailable when the server cannot be reached", async () => {
		const result = await createSmtpProbe({
			transporter: fakeTransporter(async () => {
				throw Object.assign(
					new Error("connect ECONNECTION smtp.internal:587"),
					{
						code: "ECONNECTION",
					},
				);
			}),
			secrets: [],
		}).probe(new AbortController().signal);

		expect(result.status).toBe("unavailable");
		expect(result.message).toBe("échec de la connexion");
		expect(result.message).not.toContain("smtp.internal");
	});

	it("is misconfigured when the server refuses the authentication", async () => {
		const result = await createSmtpProbe({
			transporter: fakeTransporter(async () => {
				throw Object.assign(
					new Error("Invalid login: 535 authentication failed"),
					{
						code: "EAUTH",
					},
				);
			}),
			secrets: [],
		}).probe(new AbortController().signal);

		expect(result.status).toBe("misconfigured");
	});

	it("never stores the SMTP password", async () => {
		const result = await createSmtpProbe({
			transporter: fakeTransporter(async () => {
				throw new Error(
					"login failed for user relay with password s3cr3t-pass",
				);
			}),
			secrets: ["s3cr3t-pass"],
		}).probe(new AbortController().signal);

		expect(result.status).toBe("unavailable");
		expect(result.message).toBe("connexion SMTP impossible");
		expect(result.message).not.toContain("s3cr3t-pass");
	});

	it("is operational with 'non configuré' when mail is disabled", async () => {
		const result = await createSmtpProbe({
			transporter: null,
			secrets: [],
		}).probe(new AbortController().signal);

		expect(result).toEqual({
			status: "operational",
			latencyMs: 0,
			message: "non configuré",
		});
	});
});

describe("createSmtpTransporter", () => {
	it("reuses the worker settings with bounded timeouts", () => {
		const transporter = createSmtpTransporter({
			host: "smtp.example.gouv.fr",
			port: 587,
			secure: false,
			user: "relay",
			pass: "s3cr3t-pass",
		});

		expect(transporter.options).toMatchObject({
			host: "smtp.example.gouv.fr",
			port: 587,
			secure: false,
			auth: { user: "relay", pass: "s3cr3t-pass" },
			requireTLS: true,
		});
	});

	it("does not require STARTTLS without authentication", () => {
		const transporter = createSmtpTransporter({
			host: "mailpit",
			port: 1025,
			secure: false,
		});

		expect(transporter.options.requireTLS).toBeUndefined();
	});
});
