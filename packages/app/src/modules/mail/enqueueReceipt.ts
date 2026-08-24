import "server-only";
import * as Sentry from "@sentry/nextjs";
import { and, eq, isNull } from "drizzle-orm";
import { enqueueNotification } from "notifications/publisher";
import type {
	NotificationPayloadMap,
	NotificationType,
} from "notifications/queue";
import { AUDIT_ACTIONS } from "~/modules/audit";
import {
	hasStartedSecondDeclaration,
	isInComplianceProcess,
	selectPathChoiceDeadline,
} from "~/modules/domain";
import { logAction } from "~/server/audit/log";
import { db } from "~/server/db";
import { getCampaignDeadlines } from "~/server/db/getCampaignDeadlines";
import { companies, declarations } from "~/server/db/schema";
import {
	buildDeclarationAttachments,
	buildSecondDeclarationAttachments,
} from "./buildReceiptAttachments";
import {
	selectCseOpinionReceiptVariant,
	selectDeclarationConfirmationVariant,
	selectJointEvaluationSubmittedVariant,
} from "./sendRules";
import type { MailAttachment } from "./types";

export type ReceiptKind =
	| "declaration"
	| "secondDeclaration"
	| "cseOpinion"
	| "jointEvaluation"
	| "representation";

export type EnqueueReceiptInput = {
	kind: ReceiptKind;
	to: string;
	siren: string;
	year: number;
	userId: string | null;
	isResend: boolean;
};

const KIND_TO_TYPE = {
	declaration: "declaration_confirmation",
	secondDeclaration: "second_declaration_confirmation",
	cseOpinion: "cse_opinion_receipt",
	jointEvaluation: "joint_evaluation_submitted",
	representation: "representation_receipt",
} as const satisfies Record<ReceiptKind, NotificationType>;

type ConfirmationType = (typeof KIND_TO_TYPE)[ReceiptKind];

type ReceiptContext = {
	raisonSociale: string;
	cseRequired: boolean;
	hasGapAboveThreshold: boolean;
	hasSecondDeclaration: boolean;
};

async function readReceiptContext(
	siren: string,
	year: number,
): Promise<ReceiptContext> {
	const [row] = await db
		.select({
			status: declarations.status,
			cseRequired: declarations.cseRequired,
			secondDeclarationStep: declarations.secondDeclarationStep,
			firstDeclarationPathChoice: declarations.firstDeclarationPathChoice,
			secondDeclarationPathChoice: declarations.secondDeclarationPathChoice,
		})
		.from(declarations)
		.where(
			and(
				eq(declarations.siren, siren),
				eq(declarations.year, year),
				isNull(declarations.cancelledAt),
			),
		)
		.limit(1);

	const [company] = await db
		.select({ name: companies.name })
		.from(companies)
		.where(eq(companies.siren, siren))
		.limit(1);

	const raisonSociale = company?.name ?? siren;

	if (!row) {
		return {
			raisonSociale,
			cseRequired: false,
			hasGapAboveThreshold: false,
			hasSecondDeclaration: false,
		};
	}

	return {
		raisonSociale,
		cseRequired: row.cseRequired,
		hasGapAboveThreshold: isInComplianceProcess(row),
		hasSecondDeclaration: hasStartedSecondDeclaration(row),
	};
}

async function buildConfirmationPayload(
	type: ConfirmationType,
	siren: string,
	year: number,
	context: ReceiptContext,
): Promise<NotificationPayloadMap[ConfirmationType]> {
	const base = { siren, year, raisonSociale: context.raisonSociale };

	switch (type) {
		case "declaration_confirmation":
		case "second_declaration_confirmation": {
			const variant = selectDeclarationConfirmationVariant({
				hasGapAboveThreshold: context.hasGapAboveThreshold,
				cseRequired: context.cseRequired,
			});
			if (variant === "path_to_select") {
				// The first declaration acknowledges round 1, the second round 2.
				const complianceDeadline = selectPathChoiceDeadline(
					await getCampaignDeadlines(year),
					type !== "declaration_confirmation",
				);
				return {
					...base,
					variant,
					complianceDeadline: complianceDeadline.toISOString(),
				};
			}
			return { ...base, variant };
		}
		case "joint_evaluation_submitted": {
			return {
				...base,
				variant: selectJointEvaluationSubmittedVariant({
					hasSecondDeclaration: context.hasSecondDeclaration,
					cseOpinionExpected: context.cseRequired,
				}),
			};
		}
		case "cse_opinion_receipt": {
			return {
				...base,
				variant: selectCseOpinionReceiptVariant({
					forFirstAndSecondDeclaration: context.hasSecondDeclaration,
					hasGapAboveThreshold: context.hasGapAboveThreshold,
				}),
			};
		}
		case "representation_receipt": {
			return base;
		}
	}
}

async function buildAttachments(
	kind: ReceiptKind,
	siren: string,
	year: number,
): Promise<MailAttachment[]> {
	if (kind === "declaration") return buildDeclarationAttachments(siren, year);
	if (kind === "secondDeclaration") {
		return buildSecondDeclarationAttachments(siren, year);
	}
	return [];
}

/**
 * Raises a receipt failure to Sentry and the server console, then returns the
 * human-readable reason. It writes no audit row itself — the caller is the one
 * that owns a row, and carries the returned reason into it so the failure stays
 * queryable per SIREN in `audit.action_log`.
 *
 * A non-Error throw (a rejected string, a plain object) reaches Sentry as
 * "Non-Error exception captured" and groups unrelated failures together, so it
 * is wrapped in a real Error and the original value kept as its cause.
 */
function reportReceiptFailure(
	error: unknown,
	context: { stage: "attachments" | "enqueue" } & Record<string, unknown>,
): string {
	const message = error instanceof Error ? error.message : String(error);
	const reported =
		error instanceof Error ? error : new Error(message, { cause: error });

	Sentry.captureException(reported, { extra: context });
	console.error(`[mail] receipt ${context.stage} failed: ${message}`, context);

	return message;
}

type AttachmentsOutcome = {
	attachments: MailAttachment[];
	/** Non-null when the PDF was lost and the receipt is sent without it. */
	droppedReason: string | null;
};

/**
 * Only the declaration receipts carry a PDF, and that PDF is rendered on the
 * fly. A rendering failure used to sink the whole e-mail, which is exactly the
 * symptom reported in issue 3914 — the acknowledgement never arrives. Losing
 * the attachment is bad; losing the acknowledgement is worse, so the send goes
 * on without it and the reason travels back to the caller, which records it on
 * the audit row rather than letting the degradation pass for a clean send.
 */
async function buildAttachmentsOrDrop(
	kind: ReceiptKind,
	siren: string,
	year: number,
): Promise<AttachmentsOutcome> {
	try {
		return {
			attachments: await buildAttachments(kind, siren, year),
			droppedReason: null,
		};
	} catch (error) {
		return {
			attachments: [],
			droppedReason: reportReceiptFailure(error, {
				stage: "attachments",
				kind,
				siren,
				year,
			}),
		};
	}
}

export async function enqueueReceipt(
	input: EnqueueReceiptInput,
): Promise<void> {
	const { kind, to, siren, year, userId, isResend } = input;
	const type = KIND_TO_TYPE[kind];

	try {
		const context = await readReceiptContext(siren, year);
		const payload = await buildConfirmationPayload(type, siren, year, context);
		const { attachments, droppedReason } = await buildAttachmentsOrDrop(
			kind,
			siren,
			year,
		);
		const result = await enqueueNotification({
			type,
			recipientEmail: to,
			recipientUserId: userId,
			siren,
			payload,
			...(attachments.length > 0 ? { attachments } : {}),
		});

		// A receipt that never left matters more than one that left without its
		// PDF, so the queue error wins the single error column when both happen.
		const errorMessage =
			result.status === "enqueued"
				? droppedReason
				: result.status === "error"
					? result.error
					: "queue_unavailable";

		void logAction({
			action: AUDIT_ACTIONS.NOTIFICATION_ENQUEUE,
			status: result.status === "enqueued" ? "success" : "failure",
			userId,
			userEmail: to,
			siren,
			...(result.status === "enqueued"
				? { resourceType: "notification", resourceId: result.id }
				: {}),
			// Free text belongs in the dedicated column, not in `metadata`: a direct
			// logAction call runs no sanitisation on the jsonb, so an exception
			// message parked there would be one refactor away from carrying
			// whatever a future throw site interpolates into it.
			...(errorMessage === null ? {} : { errorMessage }),
			// A dropped attachment must not read as a clean send: the enqueue did
			// succeed, so the row stays a success, but the degradation is stamped
			// on it — `metadata->>'attachmentsDropped'` is what makes "this SIREN
			// got its receipt without the PDF" answerable from the audit log.
			metadata: {
				type,
				kind,
				year,
				isResend,
				...("variant" in payload ? { variant: payload.variant } : {}),
				...(droppedReason === null ? {} : { attachmentsDropped: true }),
			},
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		reportReceiptFailure(error, { stage: "enqueue", kind, siren, year });
		void logAction({
			action: AUDIT_ACTIONS.NOTIFICATION_ENQUEUE,
			status: "failure",
			userId,
			userEmail: to,
			siren,
			errorMessage: message,
			metadata: { type, kind, year, isResend },
		});
	}
}
