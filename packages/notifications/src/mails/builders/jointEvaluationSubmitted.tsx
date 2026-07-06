import { renderEmail } from "../shared/render.js";
import { getAvisCseUrl, getMySpaceUrl } from "../shared/urls.js";
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

const BULLET_ITEMS = [
	"l'exactitude des données et des méthodes de calcul utilisées ;",
	"la justification éventuelle des écarts de rémunération supérieurs ou égaux à 5 %, au regard de critères objectifs et non sexistes, pour l'indicateur de rémunération par catégorie de salariés.",
];

export const buildJointEvaluationSubmittedMail: MailBuilder<
	"joint_evaluation_submitted"
> = async ({ siren, year, variant, raisonSociale }) => {
	let subject: string;
	let bodyContent: React.ReactNode;

	const introParagraph = (
		<>
			<EmailParagraph>
				Vous avez transmis aux services du ministre chargé du Travail le rapport
				de l'évaluation conjointe des rémunérations pour {year}, concernant
				l'entreprise <strong>{raisonSociale}</strong> (SIREN : {siren}).
			</EmailParagraph>
			<EmailParagraph>
				L'administration du travail accuse réception de cette transmission. Cet
				accusé de réception ne vaut pas contrôle de conformité de votre dépôt.
			</EmailParagraph>
		</>
	);

	const bulletList = (
		<ul
			style={{
				margin: 0,
				marginBottom: SPACING.md,
				paddingTop: SPACING.sm,
				paddingLeft: SPACING.lg,
				fontFamily: FONT.family,
				fontSize: FONT.size.body,
				lineHeight: FONT.lineHeight.body,
			}}
		>
			{BULLET_ITEMS.map((item) => (
				<li key={item} style={{ marginBottom: SPACING.xs }}>
					<strong>{item}</strong>
				</li>
			))}
		</ul>
	);

	switch (variant) {
		case "completed": {
			subject =
				"Egapro - Dépôt rapport de l'évaluation conjointe des rémunérations et fin de démarche";
			bodyContent = (
				<>
					{introParagraph}
					<EmailParagraph>
						Votre démarche est désormais terminée. Vous pouvez à tout moment
						consulter et télécharger les documents relatifs à cette démarche
						depuis votre espace.
					</EmailParagraph>
					<EmailCtaWithLink href={getMySpaceUrl()} label="Mon espace" />
				</>
			);
			break;
		}
		case "cse_to_deposit": {
			subject =
				"Egapro - Dépôt rapport de l'évaluation conjointe des rémunérations";
			bodyContent = (
				<>
					{introParagraph}
					<EmailParagraph noMarginBottom>
						Vous devez à présent déposer le ou les avis du CSE portant sur :
					</EmailParagraph>
					{bulletList}
					<EmailCtaWithLink
						href={getAvisCseUrl(siren)}
						label="Déposer le ou les avis"
					/>
				</>
			);
			break;
		}
		case "cse_first_and_second": {
			subject =
				"Egapro - Dépôt rapport de l'évaluation conjointe des rémunérations";
			bodyContent = (
				<>
					{introParagraph}
					<EmailParagraph noMarginBottom>
						Vous devez à présent déposer, pour la première et la seconde
						déclaration, le ou les avis du CSE portant sur :
					</EmailParagraph>
					{bulletList}
					<EmailCtaWithLink
						href={getAvisCseUrl(siren)}
						label="Déposer le ou les avis"
					/>
				</>
			);
			break;
		}
		default: {
			const _exhaustive: never = variant;
			throw new Error(
				`Unknown joint_evaluation_submitted variant: ${_exhaustive}`,
			);
		}
	}

	const previewText =
		"Vous avez transmis aux services du ministre chargé du Travail le rapport de l'évaluation conjointe des rémunérations.";

	const { html, text } = await renderEmail(
		<EmailShell previewText={previewText}>
			<EmailGreeting>Bonjour,</EmailGreeting>
			{bodyContent}
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
