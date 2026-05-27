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

export const buildCseOpinionReceiptMail: MailBuilder<
	"cse_opinion_receipt"
> = async () => {
	const subject = "Egapro - Réception de l'avis du CSE";
	const previewText =
		"L'avis du CSE déposé pour votre déclaration des indicateurs a bien été pris en compte.";
	const { html, text } = await renderEmail(
		<EmailShell previewText={previewText}>
			<EmailGreeting>Bonjour,</EmailGreeting>
			<EmailParagraph>
				L'avis du CSE déposé pour votre déclaration des indicateurs relatifs à
				l'égalité professionnelle entre les femmes et les hommes a bien été pris
				en compte.
			</EmailParagraph>
			<EmailParagraph>
				Conformément à la réglementation, les entreprises d'au moins 100
				salariés sont tenues de consulter leur CSE sur les indicateurs publiés
				et de déposer cet avis sur la plateforme Egapro.
			</EmailParagraph>
			<EmailParagraph>
				Le document que vous avez transmis est conservé dans votre dossier et
				reste consultable depuis votre espace personnel.
			</EmailParagraph>
			<EmailParagraph>
				Vous pouvez à tout moment consulter votre dossier depuis le portail
				Egapro.
			</EmailParagraph>
			<EmailCtaWithLink
				href={getConnectionUrl()}
				label="Consulter mon dossier"
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
