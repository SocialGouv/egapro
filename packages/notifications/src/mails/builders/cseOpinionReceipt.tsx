import { renderEmail } from "../shared/render.js";
import { getMySpaceUrl } from "../shared/urls.js";
import {
	COMPLIANCE_CRITERIA_ITEMS,
	EmailContactParagraph,
	EmailCtaWithLink,
	EmailGreeting,
	EmailParagraph,
	EmailReceiptDisclaimer,
	EmailShell,
	EmailSignature,
	FONT,
	SPACING,
} from "../template/index.js";
import type { MailBuilder } from "../types.js";

export const buildCseOpinionReceiptMail: MailBuilder<
	"cse_opinion_receipt"
> = async ({ siren, year, variant, raisonSociale }) => {
	const subject = "Egapro - Dépôt d'avis CSE et fin de démarche";
	const previewText =
		"L'administration du travail accuse réception de votre dépôt d'avis CSE. Votre démarche est désormais terminée.";

	const gapBullets = (
		<ul
			style={{
				marginTop: 0,
				marginBottom: SPACING.md,
				paddingLeft: SPACING.xl,
				fontFamily: FONT.family,
				fontSize: FONT.size.body,
				lineHeight: FONT.lineHeight.body,
			}}
		>
			{COMPLIANCE_CRITERIA_ITEMS.map((item) => (
				<li key={item}>
					<strong>{item}</strong>
				</li>
			))}
		</ul>
	);

	const receiptParagraph = (
		<>
			<EmailReceiptDisclaimer receiptNoun="dépôt" />
			<EmailParagraph>
				Votre démarche est désormais terminée. Vous pouvez à tout moment
				consulter et télécharger les documents relatifs à cette démarche depuis
				votre espace.
			</EmailParagraph>
		</>
	);

	switch (variant) {
		case "single": {
			const { html, text } = await renderEmail(
				<EmailShell previewText={previewText}>
					<EmailGreeting>Bonjour,</EmailGreeting>
					<EmailParagraph>
						Vous avez transmis aux services du ministre chargé du Travail{" "}
						<strong>
							l&apos;avis du CSE sur l&apos;exactitude des données et des
							méthodes de calcul utilisées
						</strong>{" "}
						pour la déclaration des indicateurs de rémunération {year},
						concernant l&apos;entreprise <strong>{raisonSociale}</strong> (SIREN
						: {siren}).
					</EmailParagraph>
					{receiptParagraph}
					<EmailCtaWithLink href={getMySpaceUrl()} label="Mon espace" />
					<EmailContactParagraph />
					<EmailSignature />
				</EmailShell>,
			);
			return { subject, html, text };
		}
		case "with_gap": {
			const { html, text } = await renderEmail(
				<EmailShell previewText={previewText}>
					<EmailGreeting>Bonjour,</EmailGreeting>
					<EmailParagraph noMarginBottom>
						Vous avez transmis aux services du ministre chargé du Travail{" "}
						<strong>les avis CSE</strong> pour la déclaration des indicateurs de
						rémunération {year}, concernant l&apos;entreprise{" "}
						<strong>{raisonSociale}</strong> (SIREN : {siren}) :
					</EmailParagraph>
					{gapBullets}
					{receiptParagraph}
					<EmailCtaWithLink href={getMySpaceUrl()} label="Mon espace" />
					<EmailContactParagraph />
					<EmailSignature />
				</EmailShell>,
			);
			return { subject, html, text };
		}
		case "first_and_second": {
			const { html, text } = await renderEmail(
				<EmailShell previewText={previewText}>
					<EmailGreeting>Bonjour,</EmailGreeting>
					<EmailParagraph noMarginBottom>
						Vous avez transmis aux services du ministre chargé du Travail{" "}
						<strong>les avis CSE</strong> pour la première et la seconde
						déclaration des indicateurs de rémunération {year}, concernant
						l&apos;entreprise <strong>{raisonSociale}</strong> (SIREN : {siren})
						:
					</EmailParagraph>
					{gapBullets}
					{receiptParagraph}
					<EmailCtaWithLink href={getMySpaceUrl()} label="Mon espace" />
					<EmailContactParagraph />
					<EmailSignature />
				</EmailShell>,
			);
			return { subject, html, text };
		}
	}
};
