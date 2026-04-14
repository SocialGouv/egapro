import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "~/env.js";

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
		secure: false,
		auth,
	});

	return cachedTransporter;
}
