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

export const buildSecondDeclarationReminderMail: MailBuilder<
	"second_declaration_reminder"
> = async (payload) => {
	const subject = `Egapro - Rappel : votre seconde déclaration est attendue dans ${payload.daysRemaining} jours`;
	const formattedDeadline = formatFrenchDate(payload.deadline);
	const previewText = `Il vous reste ${payload.daysRemaining} jours pour déposer votre seconde déclaration au titre des actions correctives.`;
	const { html, text } = await renderEmail(
		<EmailShell previewText={previewText}>
			<EmailGreeting>Bonjour,</EmailGreeting>
			<EmailParagraph>
				Votre seconde déclaration au titre des actions correctives n'a pas
				encore été déposée. Il vous reste {payload.daysRemaining} jours pour la
				finaliser.
			</EmailParagraph>
			<EmailParagraph>
				Conformément à la réglementation, vous avez engagé un parcours d'actions
				correctives à la suite d'un écart de rémunération supérieur ou égal à 5
				%.
			</EmailParagraph>
			<EmailParagraph>
				La seconde déclaration doit retracer les actions correctives mises en
				œuvre par votre entreprise et leur impact sur les écarts constatés.
			</EmailParagraph>
			<EmailParagraph>
				Nous vous invitons à vous rendre sur le portail Egapro afin de déposer
				votre seconde déclaration.
			</EmailParagraph>
			<EmailParagraph>
				Le dépôt doit intervenir au plus tard le {formattedDeadline}. Sans dépôt
				avant cette date, votre déclaration sera marquée comme non conforme.
			</EmailParagraph>
			<EmailCtaWithLink
				href={getDeclarationUrl(payload.siren, payload.year)}
				label="Déposer ma seconde déclaration"
			/>
			<EmailContactParagraph />
			<EmailSignature />
		</EmailShell>,
	);
	return { subject, html, text };
};
