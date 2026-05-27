import { formatFrenchDate } from "../shared/formatters.js";
import { renderEmail } from "../shared/render.js";
import { getConnectionUrl } from "../shared/urls.js";
import {
	EmailCtaWithLink,
	EmailGreeting,
	EmailParagraph,
	EmailShell,
	EmailSignature,
} from "../template/index.js";
import type { MailBuilder } from "../types.js";

export const buildDeclarationDeadlineReminderMail: MailBuilder<
	"declaration_deadline_reminder"
> = async (payload) => {
	const subject = `Egapro - Rappel : votre déclaration des indicateurs est attendue dans ${payload.daysRemaining} jours`;
	const formattedDeadline = formatFrenchDate(payload.deadline);
	const previewText = `Il vous reste ${payload.daysRemaining} jours pour finaliser votre déclaration des indicateurs.`;
	const { html, text } = await renderEmail(
		<EmailShell previewText={previewText}>
			<EmailGreeting>Bonjour,</EmailGreeting>
			<EmailParagraph>
				Votre déclaration des indicateurs relatifs à l'égalité professionnelle
				entre les femmes et les hommes n'a pas encore été finalisée. Il vous
				reste {payload.daysRemaining} jours pour la déposer.
			</EmailParagraph>
			<EmailParagraph>
				Conformément à la réglementation, votre entreprise est tenue de déclarer
				chaque année les indicateurs relatifs aux écarts de rémunération.
			</EmailParagraph>
			<EmailParagraph>
				Votre déclaration est préremplie avec les données connues de
				l'administration pour les six premiers indicateurs de rémunération,
				issues de la DSN.
			</EmailParagraph>
			<EmailParagraph>
				Nous vous invitons à vous rendre sur le portail Egapro afin de finaliser
				et publier votre déclaration.
			</EmailParagraph>
			<EmailParagraph>
				La déclaration est ouverte jusqu'au {formattedDeadline}. Au-delà de
				cette date, elle ne pourra plus être modifiée.
			</EmailParagraph>
			<EmailCtaWithLink
				href={getConnectionUrl()}
				label="Reprendre ma déclaration"
			/>
			<EmailParagraph>
				Pour tout renseignement, vous pouvez contacter votre référent égalité
				professionnelle femmes-hommes au sein de votre DREETS en répondant à ce
				message.
			</EmailParagraph>
			<EmailSignature />
		</EmailShell>,
	);
	return { subject, html, text };
};
