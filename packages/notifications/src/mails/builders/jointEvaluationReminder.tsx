import { formatFrenchDate } from "../shared/formatters.js";
import { renderEmail } from "../shared/render.js";
import { getMySpaceUrl } from "../shared/urls.js";
import {
	EmailContactParagraph,
	EmailCtaWithLink,
	EmailGreeting,
	EmailParagraph,
	EmailShell,
	EmailSignature,
} from "../template/index.js";
import type { MailBuilder } from "../types.js";

export const buildJointEvaluationReminderMail: MailBuilder<
	"joint_evaluation_reminder"
> = async (payload) => {
	const subject = "Egapro - Rappel : dépôt du rapport d'évaluation conjointe";
	const formattedDeadline = formatFrenchDate(payload.deadline);
	const previewText =
		"Le rapport d'évaluation conjointe avec votre CSE n'a pas encore été téléversé sur la plateforme.";
	const { html, text } = await renderEmail(
		<EmailShell previewText={previewText}>
			<EmailGreeting>Bonjour,</EmailGreeting>
			<EmailParagraph>
				Le rapport d'évaluation conjointe mené avec votre CSE n'a pas encore été
				téléversé sur la plateforme Egapro.
			</EmailParagraph>
			<EmailParagraph>
				Conformément à la réglementation, l'évaluation conjointe doit retracer
				les mesures correctives décidées en commun avec le CSE pour réduire les
				écarts de rémunération constatés.
			</EmailParagraph>
			<EmailParagraph>
				Le rapport doit lister précisément ces mesures correctives ainsi que
				leur calendrier de mise en œuvre.
			</EmailParagraph>
			<EmailParagraph>
				Nous vous invitons à vous rendre sur le portail Egapro afin de
				téléverser ce rapport.
			</EmailParagraph>
			<EmailParagraph>
				Le dépôt doit intervenir au plus tard le {formattedDeadline}.
			</EmailParagraph>
			<EmailCtaWithLink href={getMySpaceUrl()} label="Téléverser le rapport" />
			<EmailContactParagraph />
			<EmailSignature />
		</EmailShell>,
	);
	return { subject, html, text };
};
