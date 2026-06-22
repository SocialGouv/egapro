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

export const buildSecondDeclarationConfirmationMail: MailBuilder<
	"second_declaration_confirmation"
> = async ({ siren, year }) => {
	const subject = "Egapro - Accusé de réception de votre seconde déclaration";
	const previewText =
		"Votre seconde déclaration au titre des actions correctives a bien été enregistrée.";
	const { html, text } = await renderEmail(
		<EmailShell previewText={previewText}>
			<EmailGreeting>Bonjour,</EmailGreeting>
			<EmailParagraph>
				Votre seconde déclaration au titre des actions correctives a bien été
				enregistrée.
			</EmailParagraph>
			<EmailParagraph>
				Conformément à la réglementation, dès lors que l'écart de rémunération
				constaté est supérieur ou égal à 5 %, votre entreprise doit déposer une
				seconde déclaration retraçant les actions correctives mises en œuvre.
			</EmailParagraph>
			<EmailParagraph>
				Le récapitulatif détaillé de votre seconde déclaration est joint à cet
				e-mail au format PDF.
			</EmailParagraph>
			<EmailParagraph>
				Vous pouvez à tout moment consulter votre déclaration depuis le portail
				Egapro.
			</EmailParagraph>
			<EmailCtaWithLink
				href={getDeclarationUrl(siren, year)}
				label="Consulter ma déclaration"
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
