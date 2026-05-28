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

export const buildJointEvaluationSubmittedMail: MailBuilder<
	"joint_evaluation_submitted"
> = async () => {
	const subject = "Egapro - Réception du rapport d'évaluation conjointe";
	const previewText =
		"Le rapport d'évaluation conjointe déposé pour votre entreprise a bien été pris en compte.";
	const { html, text } = await renderEmail(
		<EmailShell previewText={previewText}>
			<EmailGreeting>Bonjour,</EmailGreeting>
			<EmailParagraph>
				Le rapport d'évaluation conjointe déposé pour votre entreprise a bien
				été pris en compte.
			</EmailParagraph>
			<EmailParagraph>
				Conformément à la réglementation, l'évaluation conjointe menée avec le
				CSE permet de retracer les mesures correctives décidées en commun pour
				réduire les écarts de rémunération constatés.
			</EmailParagraph>
			<EmailParagraph>
				Prochaine étape : votre CSE doit désormais rendre son avis sur le
				rapport déposé. Cet avis devra être téléversé sur la plateforme avant la
				date limite affichée dans votre espace personnel.
			</EmailParagraph>
			<EmailParagraph>
				Vous pouvez à tout moment consulter la suite de votre parcours depuis le
				portail Egapro.
			</EmailParagraph>
			<EmailCtaWithLink
				href={getConnectionUrl()}
				label="Voir la suite du parcours"
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
