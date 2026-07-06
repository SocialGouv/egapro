import { renderEmail } from "../shared/render.js";
import { getMySpaceUrl } from "../shared/urls.js";
import {
	EmailCtaWithLink,
	EmailGreeting,
	EmailParagraph,
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
			<li>
				<strong>
					l&apos;exactitude des données et des méthodes de calcul utilisées ;
				</strong>
			</li>
			<li>
				<strong>
					la justification éventuelle des écarts de rémunération supérieurs ou
					égaux à 5 %, au regard de critères objectifs et non sexistes, pour
					l&apos;indicateur de rémunération par catégorie de salariés.
				</strong>
			</li>
		</ul>
	);

	const receiptParagraph = (
		<>
			<EmailParagraph>
				L&apos;administration du travail accuse réception de cette transmission.
				Cet accusé de réception ne vaut pas contrôle de conformité de votre
				dépôt.
			</EmailParagraph>
			<EmailParagraph>
				Votre démarche est désormais terminée. Vous pouvez à tout moment
				consulter et télécharger les documents relatifs à cette démarche depuis
				votre espace.
			</EmailParagraph>
		</>
	);

	const contactParagraph = (
		<EmailParagraph>
			Pour tout renseignement, vous pouvez contacter votre référent égalité
			professionnelle femmes-hommes au sein de votre DREETS en répondant à ce
			message.
		</EmailParagraph>
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
					{contactParagraph}
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
					{contactParagraph}
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
					{contactParagraph}
					<EmailSignature />
				</EmailShell>,
			);
			return { subject, html, text };
		}
	}
};
