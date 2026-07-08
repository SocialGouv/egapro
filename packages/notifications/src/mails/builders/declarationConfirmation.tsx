import { renderEmail } from "../shared/render.js";
import { getConnectionUrl, getDeclarationUrl } from "../shared/urls.js";
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

export const buildDeclarationConfirmationMail: MailBuilder<
	"declaration_confirmation"
> = async (payload) => {
	const { variant, siren, year, raisonSociale, complianceDeadline } = payload;
	const connectionUrl = getConnectionUrl();
	const declarationUrl = getDeclarationUrl(siren, year);

	const introParagraph = (
		<EmailParagraph>
			Vous avez transmis aux services du ministre chargé du Travail{" "}
			<strong>
				les indicateurs relatifs aux écarts de rémunération entre les femmes et
				les hommes
			</strong>{" "}
			pour l&apos;année {year}, au titre des données {year - 1}, concernant
			l&apos;entreprise <strong>{raisonSociale}</strong> (SIREN : {siren}).
		</EmailParagraph>
	);

	const accuseParagraph = <EmailReceiptDisclaimer receiptNoun="déclaration" />;

	switch (variant) {
		case "completed": {
			const subject = "Egapro - Transmission de déclaration et fin de démarche";
			const previewText =
				"Votre démarche est désormais terminée. Vous pouvez à tout moment consulter et télécharger votre déclaration depuis votre espace.";
			const { html, text } = await renderEmail(
				<EmailShell previewText={previewText}>
					<EmailGreeting>Bonjour,</EmailGreeting>
					{introParagraph}
					{accuseParagraph}
					<EmailParagraph>
						Votre démarche est désormais terminée. Vous pouvez à tout moment
						consulter et télécharger votre déclaration depuis votre espace.
					</EmailParagraph>
					<EmailCtaWithLink href={connectionUrl} label="Mon espace" />
					<EmailContactParagraph />
					<EmailSignature />
				</EmailShell>,
			);
			return { subject, html, text };
		}
		case "cse_to_deposit": {
			const subject = "Egapro - Transmission de déclaration";
			const previewText =
				"Vous devez à présent déposer l'avis du CSE portant sur l'exactitude des données et des méthodes de calcul.";
			const { html, text } = await renderEmail(
				<EmailShell previewText={previewText}>
					<EmailGreeting>Bonjour,</EmailGreeting>
					{introParagraph}
					{accuseParagraph}
					<EmailParagraph>
						Vous devez à présent déposer l&apos;avis du CSE portant sur
						l&apos;exactitude des données et des méthodes de calcul de la
						déclaration de l&apos;ensemble des indicateurs.
					</EmailParagraph>
					<EmailCtaWithLink
						href={declarationUrl}
						label="Déposer l'avis"
						linkHref={connectionUrl}
					/>
					<EmailContactParagraph />
					<EmailSignature />
				</EmailShell>,
			);
			return { subject, html, text };
		}
		case "path_to_select": {
			const subject = "Egapro - Transmission de la déclaration";
			const previewText =
				"Un ou plusieurs écarts de rémunération supérieurs ou égaux à 5 % ont été constatés. Vous devez sélectionner un parcours de mise en conformité.";
			const { html, text } = await renderEmail(
				<EmailShell previewText={previewText}>
					<EmailGreeting>Bonjour,</EmailGreeting>
					{introParagraph}
					{accuseParagraph}
					<EmailParagraph>
						L&apos;indicateur d&apos;écart de rémunération par catégorie de
						salariée fait apparaître un ou plusieurs écarts de rémunération
						supérieurs ou égaux à 5 %. Vous devez, en conséquence, sélectionner
						un parcours de mise en conformité au plus tard le{" "}
						{complianceDeadline}.
					</EmailParagraph>
					<EmailCtaWithLink
						href={declarationUrl}
						label="Sélectionner le parcours"
						linkHref={connectionUrl}
					/>
					<EmailContactParagraph />
					<EmailSignature />
				</EmailShell>,
			);
			return { subject, html, text };
		}
	}
};
