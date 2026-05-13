import type { NotificationPayloadMap, NotificationType } from "../types";
import { buildAnnualDeadlineReminderTemplate } from "./annualDeadlineReminder";
import { buildCampaignOpeningTemplate } from "./campaignOpening";
import { buildCseOpinionSubmittedTemplate } from "./cseOpinionSubmitted";
import { buildDeclarationSubmittedTemplate } from "./declarationSubmitted";
import { buildJointEvaluationSubmittedTemplate } from "./jointEvaluationSubmitted";
import { buildSecondDeclarationReminderTemplate } from "./secondDeclarationReminder";
import { buildSecondDeclarationSubmittedTemplate } from "./secondDeclarationSubmitted";

export type BuiltTemplate = {
	subject: string;
	html: string;
};

export function buildNotificationTemplate<T extends NotificationType>(
	type: T,
	payload: NotificationPayloadMap[T],
): BuiltTemplate {
	switch (type) {
		case "declaration_submitted":
			return buildDeclarationSubmittedTemplate(
				payload as NotificationPayloadMap["declaration_submitted"],
			);
		case "second_declaration_submitted":
			return buildSecondDeclarationSubmittedTemplate(
				payload as NotificationPayloadMap["second_declaration_submitted"],
			);
		case "cse_opinion_submitted":
			return buildCseOpinionSubmittedTemplate(
				payload as NotificationPayloadMap["cse_opinion_submitted"],
			);
		case "joint_evaluation_submitted":
			return buildJointEvaluationSubmittedTemplate(
				payload as NotificationPayloadMap["joint_evaluation_submitted"],
			);
		case "campaign_opening":
			return buildCampaignOpeningTemplate(
				payload as NotificationPayloadMap["campaign_opening"],
			);
		case "second_declaration_reminder":
			return buildSecondDeclarationReminderTemplate(
				payload as NotificationPayloadMap["second_declaration_reminder"],
			);
		case "annual_deadline_reminder":
			return buildAnnualDeadlineReminderTemplate(
				payload as NotificationPayloadMap["annual_deadline_reminder"],
			);
		default: {
			const _exhaustive: never = type;
			throw new Error(`Unknown notification type: ${String(_exhaustive)}`);
		}
	}
}

export {
	buildAnnualDeadlineReminderTemplate,
	buildCampaignOpeningTemplate,
	buildCseOpinionSubmittedTemplate,
	buildDeclarationSubmittedTemplate,
	buildJointEvaluationSubmittedTemplate,
	buildSecondDeclarationReminderTemplate,
	buildSecondDeclarationSubmittedTemplate,
};
