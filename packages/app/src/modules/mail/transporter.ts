import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "~/env.js";

/**
 * Cached for the lifetime of the Node.js process. Env vars are read once at
 * first call; changes to SMTP_HOST / SMTP_PORT / auth require a restart of
 * the pod. That's the expected behaviour on Kubernetes since the Deployment
 * is recreated when the configmap or secret changes.
 */
let cachedTransporter: Transporter | null = null;

export function getTransporter(): Transporter {
	if (cachedTransporter) return cachedTransporter;

	const auth =
		env.SMTP_USER && env.SMTP_PASS
			? { user: env.SMTP_USER, pass: env.SMTP_PASS }
			: undefined;

	cachedTransporter = nodemailer.createTransport({
		host: env.SMTP_HOST,
		port: env.SMTP_PORT,
		secure: env.SMTP_SECURE,
		auth,
	});

	return cachedTransporter;
}
