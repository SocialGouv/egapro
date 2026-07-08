import { formatFrenchDate } from "../shared/formatters.js";
import { renderEmail } from "../shared/render.js";
import { getDeclarationUrl } from "../shared/urls.js";
import {
	EmailContactParagraph,
	EmailCtaWithLink,
	EmailGreeting,
	EmailParagraph,
	EmailShell,
	EmailSignature,
} from "../template/index.js";
import type { MailBuilder } from "../types.js";

export const buildCompliancePathChoiceReminderMail: MailBuilder<
	"compliance_path_choice_reminder"
> = async (payload) => {
	const subject =
		"Egapro - Rappel : choix de votre parcours de mise en conformité";
	const formattedDeadline = formatFrenchDate(payload.deadline);
	const previewText =
		"Vous devez choisir un parcours de mise en conformité avant la date limite.";
	const { html, text } = await renderEmail(
		<EmailShell previewText={previewText}>
			<EmailGreeting>Bonjour,</EmailGreeting>
			<EmailParagraph>
				Votre déclaration des indicateurs fait apparaître un écart de
				rémunération supérieur ou égal à 5 %. Vous n'avez pas encore choisi
				votre parcours de mise en conformité.
			</EmailParagraph>
			<EmailParagraph>
				Conformément à la réglementation, lorsque l'écart de rémunération
				constaté est supérieur ou égal à 5 %, votre entreprise doit choisir un
				parcours de mise en conformité pour réduire cet écart.
			</EmailParagraph>
			<EmailParagraph>
				Trois parcours sont disponibles : justification des écarts, actions
				correctives, ou évaluation conjointe avec votre CSE. Le détail et les
				conséquences de chaque option sont expliqués sur le portail Egapro.
			</EmailParagraph>
			<EmailParagraph>
				Nous vous invitons à vous rendre sur le portail Egapro afin d'effectuer
				ce choix.
			</EmailParagraph>
			<EmailParagraph>
				La sélection doit intervenir au plus tard le {formattedDeadline}.
			</EmailParagraph>
			<EmailCtaWithLink
				href={getDeclarationUrl(payload.siren, payload.year)}
				label="Choisir mon parcours"
			/>
			<EmailContactParagraph />
			<EmailSignature />
		</EmailShell>,
	);
	return { subject, html, text };
};
