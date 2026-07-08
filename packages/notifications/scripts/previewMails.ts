/**
 * Mail preview — render every mail variant and ship each one to MailDev.
 *
 * Use case: after a copy/template change, open MailDev's web UI side-by-side
 * with the Figma source of truth (node `9564-114784`) to spot any regression.
 *
 * Prereqs:
 *   docker compose up -d maildev
 *   pnpm --filter notifications preview
 *
 * Defaults (override via env vars):
 *   SMTP_HOST=localhost
 *   SMTP_PORT=1025
 *   MAIL_FROM=no-reply@egapro.local
 *   PREVIEW_TO=preview@example.org
 *   EGAPRO_PUBLIC_URL=http://localhost:3000
 *   PREVIEW_TYPE=<single notification type; sends all its variants>
 *
 * Open the rendered mails: http://localhost:1080
 *
 * Cleanup after previewing:
 *   - MailDev clears itself on container restart (volatile by design)
 *   - This script is git-tracked (devTooling, not test fixture)
 */

import nodemailer from "nodemailer";
import { buildMail } from "../src/mails/index.js";
import {
	CSE_OPINION_RECEIPT_VARIANTS,
	CSE_OPINION_REMINDER_VARIANTS,
	DECLARATION_CONFIRMATION_VARIANTS,
	JOINT_EVALUATION_SUBMITTED_VARIANTS,
	NOTIFICATION_TYPES,
	type NotificationPayloadMap,
	type NotificationType,
} from "../src/mails/types.js";

const SIREN = "552100554";
const YEAR = 2027;
const DEADLINE = "2027-06-01T00:00:00.000Z";
const RAISON_SOCIALE = "Société Démo";
const BASE = { siren: SIREN, year: YEAR };

// One preview job per mail *variant* — the confirmation mails and the CSE opinion
// reminder each have several variants, so a single payload per type would only
// exercise one of them (and, since #3670, would crash on the missing `variant`).
// Iterating the exported *_VARIANTS arrays keeps this in sync automatically when
// a variant is added.
type PreviewJob = {
	[T in NotificationType]: {
		type: T;
		label: string;
		payload: NotificationPayloadMap[T];
	};
}[NotificationType];

const JOBS: PreviewJob[] = [
	...DECLARATION_CONFIRMATION_VARIANTS.map((variant) => ({
		type: "declaration_confirmation" as const,
		label: `declaration_confirmation/${variant}`,
		payload: {
			...BASE,
			variant,
			raisonSociale: RAISON_SOCIALE,
			complianceDeadline: DEADLINE,
		},
	})),
	...DECLARATION_CONFIRMATION_VARIANTS.map((variant) => ({
		type: "second_declaration_confirmation" as const,
		label: `second_declaration_confirmation/${variant}`,
		payload: {
			...BASE,
			variant,
			raisonSociale: RAISON_SOCIALE,
			complianceDeadline: DEADLINE,
		},
	})),
	...JOINT_EVALUATION_SUBMITTED_VARIANTS.map((variant) => ({
		type: "joint_evaluation_submitted" as const,
		label: `joint_evaluation_submitted/${variant}`,
		payload: { ...BASE, variant, raisonSociale: RAISON_SOCIALE },
	})),
	...CSE_OPINION_RECEIPT_VARIANTS.map((variant) => ({
		type: "cse_opinion_receipt" as const,
		label: `cse_opinion_receipt/${variant}`,
		payload: { ...BASE, variant, raisonSociale: RAISON_SOCIALE },
	})),
	{
		type: "cycle_opening_info",
		label: "cycle_opening_info",
		payload: { ...BASE, deadline: DEADLINE },
	},
	{
		type: "declaration_deadline_reminder",
		label: "declaration_deadline_reminder",
		payload: { ...BASE, deadline: DEADLINE, daysRemaining: 30 },
	},
	{
		type: "compliance_path_choice_reminder",
		label: "compliance_path_choice_reminder",
		payload: { ...BASE, deadline: "2027-07-01T00:00:00.000Z" },
	},
	{
		type: "second_declaration_reminder",
		label: "second_declaration_reminder",
		payload: {
			...BASE,
			deadline: "2028-01-01T00:00:00.000Z",
			daysRemaining: 90,
		},
	},
	{
		type: "joint_evaluation_reminder",
		label: "joint_evaluation_reminder",
		payload: { ...BASE, deadline: "2027-09-01T00:00:00.000Z" },
	},
	...CSE_OPINION_REMINDER_VARIANTS.map((variant) => ({
		type: "cse_opinion_reminder" as const,
		label: `cse_opinion_reminder/${variant}`,
		payload: { ...BASE, deadline: "2028-03-01T00:00:00.000Z", variant },
	})),
	{
		type: "next_cycle_handover",
		label: "next_cycle_handover",
		payload: { siren: SIREN, previousYear: YEAR, nextYear: YEAR + 1 },
	},
];

const HOST = process.env.SMTP_HOST ?? "localhost";
const PORT = Number.parseInt(process.env.SMTP_PORT ?? "1025", 10);
const FROM = process.env.MAIL_FROM ?? "no-reply@egapro.local";
const TO = process.env.PREVIEW_TO ?? "preview@example.org";

function isNotificationType(value: string): value is NotificationType {
	return (NOTIFICATION_TYPES as readonly string[]).includes(value);
}

async function sendOne(
	transporter: nodemailer.Transporter,
	job: PreviewJob,
): Promise<void> {
	const { subject, html, text } = await buildMail(job.type, job.payload);
	await transporter.sendMail({ from: FROM, to: TO, subject, html, text });
	console.log(`  ✔ ${job.label.padEnd(44)} subject="${subject}"`);
}

async function main(): Promise<void> {
	const requested = process.env.PREVIEW_TYPE;
	const jobs: PreviewJob[] = requested
		? (() => {
				if (!isNotificationType(requested)) {
					throw new Error(
						`PREVIEW_TYPE="${requested}" is not a valid notification type. Pick one of: ${NOTIFICATION_TYPES.join(", ")}`,
					);
				}
				return JOBS.filter((job) => job.type === requested);
			})()
		: JOBS;

	console.log(`Connecting to MailDev on smtp://${HOST}:${PORT} …`);
	const transporter = nodemailer.createTransport({
		host: HOST,
		port: PORT,
		secure: false,
	});

	console.log(`Sending ${jobs.length} mail(s) to ${TO}:`);
	for (const job of jobs) {
		await sendOne(transporter, job);
	}
	transporter.close();

	console.log("\nDone. Inspect the rendered HTML in MailDev:");
	console.log("  http://localhost:1080");
}

main().catch((error: unknown) => {
	console.error("[mail-preview] failed:", error);
	process.exit(1);
});
