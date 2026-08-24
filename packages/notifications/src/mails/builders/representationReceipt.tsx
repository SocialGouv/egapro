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

export const buildRepresentationReceiptMail: MailBuilder<
	"representation_receipt"
> = async ({ siren, year, raisonSociale }) => {
	const subject = "Egapro - Représentation équilibrée : accusé de réception";
	const previewText =
		"L'administration du travail accuse réception de votre déclaration des indicateurs de représentation équilibrée.";

	const { html, text } = await renderEmail(
		<EmailShell previewText={previewText}>
			<EmailGreeting>Bonjour,</EmailGreeting>
			<EmailParagraph>
				Vous avez transmis aux services du ministre chargé du Travail{" "}
				<strong>
					la déclaration des indicateurs de représentation équilibrée
				</strong>{" "}
				au titre de la période de référence {year}, concernant l&apos;entreprise{" "}
				<strong>{raisonSociale}</strong> (SIREN : {siren}).
			</EmailParagraph>
			<EmailReceiptDisclaimer receiptNoun="déclaration" />
			<EmailParagraph>
				Votre démarche est désormais terminée. Vous pouvez à tout moment
				consulter et télécharger le récapitulatif de cette déclaration depuis
				votre espace.
			</EmailParagraph>
			<EmailCtaWithLink href={getMySpaceUrl()} label="Mon espace" />
			<EmailContactParagraph />
			<EmailSignature />
		</EmailShell>,
	);
	return { subject, html, text };
};
