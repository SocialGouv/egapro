import nodemailer, { type Transporter } from "nodemailer";

export function getMailEnabled(): boolean {
	return (process.env.MAIL_ENABLED ?? "false").toLowerCase() === "true";
}

export function buildTransporter(): Transporter {
	const host = process.env.SMTP_HOST;
	if (!host) {
		throw new Error("SMTP_HOST must be set when MAIL_ENABLED=true");
	}
	const port = parseInt(process.env.SMTP_PORT ?? "1025", 10);
	const secure = (process.env.SMTP_SECURE ?? "false").toLowerCase() === "true";
	const auth =
		process.env.SMTP_USER && process.env.SMTP_PASS
			? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
			: undefined;
	// `requireTLS` enforces STARTTLS on plain-text ports; combined with a
	// `minVersion` floor at TLS 1.2 it prevents silent downgrade attacks.
	// We only apply it when SMTP auth is configured (i.e. real SMTP relay) —
	// the MailDev local container has no TLS support and would refuse the
	// connection if STARTTLS were required.
	const hardenTls = auth !== undefined;
	return nodemailer.createTransport({
		host,
		port,
		secure,
		auth,
		...(hardenTls
			? { requireTLS: !secure, tls: { minVersion: "TLSv1.2" } }
			: {}),
	});
}
