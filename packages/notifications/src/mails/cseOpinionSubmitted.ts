import { formatSiren, getPublicUrl } from "./helpers.js";
import { ctaButton, infoList, paragraph, wrapEmail } from "./shell.js";
import type { MailBuilder } from "./types.js";

export const buildCseOpinionSubmittedMail: MailBuilder<
	"cse_opinion_submitted"
> = (payload) => {
	const subject = `Confirmation — Avis du CSE transmis (${payload.year})`;
	const body = `
${infoList([
	{ label: "Entreprise (SIREN)", value: formatSiren(payload.siren) },
	{ label: "Année concernée", value: payload.year },
])}
${paragraph("L'avis du CSE associé à votre déclaration a bien été enregistré.")}
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
			intro: "Nous accusons réception de la transmission de l'avis du CSE.",
			body,
		}),
	};
};
