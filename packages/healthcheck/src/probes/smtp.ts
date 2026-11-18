import nodemailer, { type Transporter } from "nodemailer";

import { describeError, isAuthenticationError } from "./errors.js";
import { startTimer } from "./timing.js";
import type { Probe } from "./types.js";

const SMTP_TIMEOUT_MS = 10_000;
const SMTP_INTERVAL_SECONDS = 60;
const SMTP_CONNECTION_TIMEOUT_MS = 5000;

export type SmtpConnectionConfig = {
	host: string;
	port: number;
	secure: boolean;
	user?: string;
	pass?: string;
};

export type SmtpProbeOptions = {
	transporter: Transporter | null;
	secrets: readonly string[];
	intervalSeconds?: number;
	timeoutMs?: number;
};

export function createSmtpTransporter({
	host,
	port,
	secure,
	user,
	pass,
}: SmtpConnectionConfig): Transporter {
	const auth = user && pass ? { user, pass } : undefined;
	const hardenStartTls = auth !== undefined && !secure;

	return nodemailer.createTransport({
		host,
		port,
		secure,
		auth,
		connectionTimeout: SMTP_CONNECTION_TIMEOUT_MS,
		greetingTimeout: SMTP_CONNECTION_TIMEOUT_MS,
		socketTimeout: SMTP_TIMEOUT_MS,
		...(hardenStartTls
			? { requireTLS: true, tls: { minVersion: "TLSv1.2" } }
			: {}),
	});
}

export function createSmtpProbe({
	transporter,
	secrets,
	intervalSeconds = SMTP_INTERVAL_SECONDS,
	timeoutMs = SMTP_TIMEOUT_MS,
}: SmtpProbeOptions): Probe {
	return {
		key: "smtp",
		label: "SMTP (envoi des e-mails)",
		criticality: "important",
		kind: "internal",
		intervalSeconds,
		timeoutMs,
		async probe() {
			if (!transporter) {
				return {
					status: "operational",
					latencyMs: 0,
					message: "non configuré",
				};
			}

			const elapsed = startTimer();
			try {
				await transporter.verify();
				return { status: "operational", latencyMs: elapsed() };
			} catch (error) {
				return {
					status: isAuthenticationError(error)
						? "misconfigured"
						: "unavailable",
					latencyMs: elapsed(),
					message: describeError(error, secrets, "connexion SMTP impossible"),
				};
			}
		},
	};
}
