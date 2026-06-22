import { formatFrenchDate } from "../shared/formatters.js";
import { renderEmail } from "../shared/render.js";
import { getDeclarationUrl } from "../shared/urls.js";
import {
	EmailCtaWithLink,
	EmailGreeting,
	EmailParagraph,
	EmailShell,
	EmailSignature,
} from "../template/index.js";
import type { MailBuilder } from "../types.js";

export const buildCycleOpeningInfoMail: MailBuilder<
	"cycle_opening_info"
> = async (payload) => {
	const subject =
		"Egapro - Ouverture de la période de déclaration des indicateurs Egapro";
	const formattedDeadline = formatFrenchDate(payload.deadline);
	const previewText =
		"La période de déclaration des indicateurs relatifs à l'égalité professionnelle entre les femmes et les hommes est désormais ouverte.";
	const { html, text } = await renderEmail(
		<EmailShell previewText={previewText}>
			<EmailGreeting>Bonjour,</EmailGreeting>
			<EmailParagraph>
				La période de déclaration des indicateurs relatifs à l'égalité
				professionnelle entre les femmes et les hommes est désormais ouverte.
			</EmailParagraph>
			<EmailParagraph>
				Conformément à la réglementation, votre entreprise se doit de déclarer
				les indicateurs relatifs aux écarts de rémunération.
			</EmailParagraph>
			<EmailParagraph>
				Votre déclaration est préremplie avec les données connues de
				l'administration pour les six premiers indicateurs de rémunération,
				issues de la DSN.
			</EmailParagraph>
			<EmailParagraph>
				Nous vous invitons à vous rendre sur le portail Egapro afin de vérifier
				ces informations, de les modifier si nécessaire, et de compléter le 7ᵉ
				indicateur pour les entreprises concernées.
			</EmailParagraph>
			<EmailParagraph>
				La déclaration est ouverte jusqu'au {formattedDeadline}. Nous vous
				remercions de bien vouloir la finaliser dans ce délai.
			</EmailParagraph>
			<EmailCtaWithLink
				href={getDeclarationUrl(payload.siren, payload.year)}
				label="Commencer ma déclaration"
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
