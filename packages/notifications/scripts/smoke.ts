/**
 * Smoke test — render the 11 mail builders and ship each one to MailDev.
 *
 * Use case: after a copy/template change, open MailDev's web UI side-by-side
 * with the Figma source of truth (node `9564-114784`) to spot any regression.
 *
 * Prereqs:
 *   docker compose up -d maildev
 *   pnpm --filter notifications smoke
 *
 * Defaults (override via env vars):
 *   SMTP_HOST=localhost
 *   SMTP_PORT=1025
 *   MAIL_FROM=no-reply@egapro.local
 *   SMOKE_TO=smoke-test@example.org
 *   EGAPRO_PUBLIC_URL=http://localhost:3000
 *   SMOKE_TYPE=<single notification type to send instead of all 11>
 *
 * Open the rendered mails: http://localhost:1080
 *
 * Cleanup after smoking:
 *   - MailDev clears itself on container restart (volatile by design)
 *   - This script is git-tracked (devTooling, not test fixture)
 */

import nodemailer from "nodemailer";
import { buildMail } from "../src/mails/index.js";
import {
	NOTIFICATION_TYPES,
	type NotificationPayloadMap,
	type NotificationType,
} from "../src/mails/types.js";

const SIREN = "552100554";
const YEAR = 2027;
const DEADLINE = "2027-06-01T00:00:00.000Z";

const PAYLOADS: NotificationPayloadMap = {
	declaration_confirmation: { siren: SIREN, year: YEAR },
	second_declaration_confirmation: { siren: SIREN, year: YEAR },
	cse_opinion_receipt: { siren: SIREN, year: YEAR },
	joint_evaluation_submitted: { siren: SIREN, year: YEAR },
	cycle_opening_info: { siren: SIREN, year: YEAR, deadline: DEADLINE },
	declaration_deadline_reminder: {
		siren: SIREN,
		year: YEAR,
		deadline: DEADLINE,
		daysRemaining: 30,
	},
	compliance_path_choice_reminder: {
		siren: SIREN,
		year: YEAR,
		deadline: "2027-07-01T00:00:00.000Z",
	},
	second_declaration_reminder: {
		siren: SIREN,
		year: YEAR,
		deadline: "2028-01-01T00:00:00.000Z",
		daysRemaining: 90,
	},
	joint_evaluation_reminder: {
		siren: SIREN,
		year: YEAR,
		deadline: "2027-09-01T00:00:00.000Z",
	},
	cse_opinion_reminder: {
		siren: SIREN,
		year: YEAR,
		deadline: "2028-03-01T00:00:00.000Z",
		variant: "compliance",
	},
	next_cycle_handover: {
		siren: SIREN,
		previousYear: YEAR,
		nextYear: YEAR + 1,
	},
};

const HOST = process.env.SMTP_HOST ?? "localhost";
const PORT = Number.parseInt(process.env.SMTP_PORT ?? "1025", 10);
const FROM = process.env.MAIL_FROM ?? "no-reply@egapro.local";
const TO = process.env.SMOKE_TO ?? "smoke-test@example.org";

function isNotificationType(value: string): value is NotificationType {
	return (NOTIFICATION_TYPES as readonly string[]).includes(value);
}

async function sendOne<T extends NotificationType>(
	transporter: nodemailer.Transporter,
	type: T,
): Promise<void> {
	const payload = PAYLOADS[type];
	const { subject, html, text } = await buildMail(type, payload);
	await transporter.sendMail({ from: FROM, to: TO, subject, html, text });
	console.log(`  ✔ ${type.padEnd(36)} subject="${subject}"`);
}

async function main(): Promise<void> {
	const requested = process.env.SMOKE_TYPE;
	const types: readonly NotificationType[] = requested
		? (() => {
				if (!isNotificationType(requested)) {
					throw new Error(
						`SMOKE_TYPE="${requested}" is not a valid notification type. Pick one of: ${NOTIFICATION_TYPES.join(", ")}`,
					);
				}
				return [requested];
			})()
		: NOTIFICATION_TYPES;

	console.log(`Connecting to MailDev on smtp://${HOST}:${PORT} …`);
	const transporter = nodemailer.createTransport({
		host: HOST,
		port: PORT,
		secure: false,
	});

	console.log(`Sending ${types.length} mail(s) to ${TO}:`);
	for (const type of types) {
		await sendOne(transporter, type);
	}
	transporter.close();

	console.log("\nDone. Inspect the rendered HTML in MailDev:");
	console.log("  http://localhost:1080");
}

main().catch((error: unknown) => {
	console.error("[smoke] failed:", error);
	process.exit(1);
});
