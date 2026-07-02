import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { enqueueNotification } from "notifications/publisher";
import type {
	NotificationPayloadMap,
	NotificationType,
} from "notifications/queue";
import { AUDIT_ACTIONS } from "~/modules/audit";
import { getCurrentCompliancePath } from "~/modules/domain";
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
	| "jointEvaluation";

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

	const hasGapAboveThreshold =
		getCurrentCompliancePath(row) !== null ||
		row.status === "awaiting_compliance_path_choice" ||
		row.status === "awaiting_revision_choice";

	const hasSecondDeclaration =
		row.secondDeclarationStep !== null ||
		row.secondDeclarationPathChoice !== null;

	return {
		raisonSociale,
		cseRequired: row.cseRequired,
		hasGapAboveThreshold,
		hasSecondDeclaration,
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
				const deadlines = await getCampaignDeadlines(year);
				return {
					...base,
					variant,
					complianceDeadline: deadlines.pathChoiceDeadline.toISOString(),
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

export async function enqueueReceipt(
	input: EnqueueReceiptInput,
): Promise<void> {
	const { kind, to, siren, year, userId, isResend } = input;
	const type = KIND_TO_TYPE[kind];

	try {
		const context = await readReceiptContext(siren, year);
		const payload = await buildConfirmationPayload(type, siren, year, context);
		const attachments = await buildAttachments(kind, siren, year);
		const result = await enqueueNotification({
			type,
			recipientEmail: to,
			recipientUserId: userId,
			siren,
			payload,
			...(attachments.length > 0 ? { attachments } : {}),
		});

		void logAction({
			action: AUDIT_ACTIONS.NOTIFICATION_ENQUEUE,
			status: result.status === "enqueued" ? "success" : "failure",
			userId,
			userEmail: to,
			siren,
			...(result.status === "enqueued"
				? { resourceType: "notification", resourceId: result.id }
				: {
						errorMessage:
							result.status === "error" ? result.error : "queue_unavailable",
					}),
			metadata: { type, kind, year, isResend, variant: payload.variant },
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
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
