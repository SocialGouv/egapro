import { formatSiren, getPublicUrl } from "./helpers.js";
import type { MailBuilder } from "./types.js";
import { ctaButton, infoList, paragraph, wrapEmail } from "./view/shell.js";

export const buildJointEvaluationSubmittedMail: MailBuilder<
	"joint_evaluation_submitted"
> = (payload) => {
	const subject = `Confirmation — Dépôt du rapport d'évaluation conjointe (${payload.year})`;
	const body = `
${infoList([
	{ label: "Entreprise (SIREN)", value: formatSiren(payload.siren) },
	{ label: "Année concernée", value: payload.year },
])}
${paragraph("Le rapport d'évaluation conjointe associé à votre déclaration a bien été enregistré.")}
${paragraph("<strong>Prochaine étape :</strong> si votre entreprise dispose d'un CSE, déposez son avis avant le 1er mars suivant.")}
${ctaButton({
	label: "Voir ma déclaration",
	href: `${getPublicUrl()}/mon-espace`,
})}
${paragraph("Cordialement,<br>L'équipe Egapro")}
`;
	return {
		subject,
		html: wrapEmail({
			title: subject,
			intro:
				"Nous accusons réception du dépôt du rapport d'évaluation conjointe.",
			body,
		}),
	};
};
