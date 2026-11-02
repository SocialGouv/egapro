import { renderEmail } from "../shared/render.js";
import { getMySpaceUrl } from "../shared/urls.js";
import {
	EmailContactParagraph,
	EmailCtaWithLink,
	EmailGreeting,
	EmailParagraph,
	EmailReceiptDisclaimer,
	EmailShell,
	EmailSignature,
} from "../template/index.js";
import type { MailBuilder } from "../types.js";

export const buildFormalNoticeJointEvaluationSubmittedMail: MailBuilder<
	"formal_notice_joint_evaluation_submitted"
> = async ({ siren, year, raisonSociale }) => {
	const subject =
		"Egapro - Dépôt rapport de l'évaluation conjointe des rémunérations suite à mise en demeure";
	const previewText =
		"Vous avez transmis aux services du ministre chargé du Travail le rapport de l'évaluation conjointe des rémunérations.";

	const { html, text } = await renderEmail(
		<EmailShell previewText={previewText}>
			<EmailGreeting>Bonjour,</EmailGreeting>
			<EmailParagraph>
				Vous avez transmis aux services du ministre chargé du Travail le rapport
				de l&apos;évaluation conjointe des rémunérations pour {year}, établi à
				la suite de la mise en demeure notifiée par la DREETS, concernant
				l&apos;entreprise <strong>{raisonSociale}</strong> (SIREN : {siren}).
			</EmailParagraph>
			<EmailReceiptDisclaimer receiptNoun="dépôt" />
			<EmailParagraph>
				Vous pouvez à tout moment consulter et télécharger les documents
				relatifs à cette démarche depuis votre espace.
			</EmailParagraph>
			<EmailCtaWithLink href={getMySpaceUrl()} label="Mon espace" />
			<EmailContactParagraph />
			<EmailSignature />
		</EmailShell>,
	);
	return { subject, html, text };
};
