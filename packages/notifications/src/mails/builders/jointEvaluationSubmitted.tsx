import { renderEmail } from "../shared/render.js";
import { getAvisCseUrl, getMySpaceUrl } from "../shared/urls.js";
import {
	EmailComplianceCriteriaList,
	EmailContactParagraph,
	EmailCtaWithLink,
	EmailGreeting,
	EmailParagraph,
	EmailReceiptDisclaimer,
	EmailShell,
	EmailSignature,
} from "../template/index.js";
import type { MailBuilder } from "../types.js";

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
			<EmailReceiptDisclaimer receiptNoun="dépôt" />
		</>
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
					<EmailComplianceCriteriaList />
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
					<EmailComplianceCriteriaList />
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
			<EmailContactParagraph />
			<EmailSignature />
		</EmailShell>,
	);
	return { subject, html, text };
};
