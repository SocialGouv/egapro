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

export const buildDeclarationConfirmationMail: MailBuilder<
	"declaration_confirmation"
> = async () => {
	const subject =
		"Egapro - Accusé de réception de votre déclaration des indicateurs";
	const previewText =
		"Votre déclaration des indicateurs relatifs à l'égalité professionnelle entre les femmes et les hommes a bien été enregistrée.";
	const { html, text } = await renderEmail(
		<EmailShell previewText={previewText}>
			<EmailGreeting>Bonjour,</EmailGreeting>
			<EmailParagraph>
				Votre déclaration des indicateurs relatifs à l'égalité professionnelle
				entre les femmes et les hommes a bien été enregistrée.
			</EmailParagraph>
			<EmailParagraph>
				Conformément à la réglementation, votre entreprise satisfait à
				l'obligation annuelle de déclaration des indicateurs relatifs aux écarts
				de rémunération.
			</EmailParagraph>
			<EmailParagraph>
				Le récapitulatif détaillé de votre déclaration est joint à cet e-mail au
				format PDF. Il reprend l'ensemble des indicateurs enregistrés ainsi que
				le niveau de résultat obtenu.
			</EmailParagraph>
			<EmailParagraph>
				Vous pouvez à tout moment consulter ou modifier votre déclaration depuis
				le portail Egapro.
			</EmailParagraph>
			<EmailCtaWithLink
				href={getConnectionUrl()}
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
