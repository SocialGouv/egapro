import { buildAnnualDeadlineReminderMail } from "./annualDeadlineReminder.js";
import { buildCampaignOpeningMail } from "./campaignOpening.js";
import { buildCseOpinionSubmittedMail } from "./cseOpinionSubmitted.js";
import { buildDeclarationSubmittedMail } from "./declarationSubmitted.js";
import { buildJointEvaluationSubmittedMail } from "./jointEvaluationSubmitted.js";
import { buildSecondDeclarationReminderMail } from "./secondDeclarationReminder.js";
import { buildSecondDeclarationSubmittedMail } from "./secondDeclarationSubmitted.js";
import { NOTIFICATION_TYPES, } from "./types.js";
export const MAIL_BUILDERS = {
    declaration_submitted: buildDeclarationSubmittedMail,
    second_declaration_submitted: buildSecondDeclarationSubmittedMail,
    cse_opinion_submitted: buildCseOpinionSubmittedMail,
    joint_evaluation_submitted: buildJointEvaluationSubmittedMail,
    campaign_opening: buildCampaignOpeningMail,
    second_declaration_reminder: buildSecondDeclarationReminderMail,
    annual_deadline_reminder: buildAnnualDeadlineReminderMail,
};
export function isNotificationType(value) {
    return (typeof value === "string" &&
        NOTIFICATION_TYPES.includes(value));
}
export function buildMail(type, payload) {
    const builder = MAIL_BUILDERS[type];
    if (!builder) {
        throw new Error(`Unknown notification type: ${String(type)}`);
    }
    return builder(payload);
}
export { NOTIFICATION_TYPES, };
