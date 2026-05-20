import { formatSiren, getPublicUrl } from "./helpers.js";
import type { MailBuilder } from "./types.js";
import { ctaButton, infoList, paragraph, wrapEmail } from "./view/shell.js";

export const buildCseOpinionReceiptMail: MailBuilder<"cse_opinion_receipt"> = (
	payload,
) => {
	const subject = `Accusé de réception — Avis du CSE ${payload.year}`;
	const body = `
${infoList([
	{ label: "Entreprise (SIREN)", value: formatSiren(payload.siren) },
	{ label: "Année concernée", value: payload.year },
])}
${paragraph("Le dépôt de l'avis du CSE sur les indicateurs de l'égalité professionnelle a bien été enregistré.")}
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
			intro: "Nous accusons réception du dépôt de l'avis du CSE.",
			body,
		}),
	};
};
