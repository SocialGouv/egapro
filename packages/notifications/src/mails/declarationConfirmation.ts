import { formatSiren, getPublicUrl } from "./helpers.js";
import type { MailBuilder } from "./types.js";
import { ctaButton, infoList, paragraph, wrapEmail } from "./view/shell.js";

export const buildDeclarationConfirmationMail: MailBuilder<
	"declaration_confirmation"
> = (payload) => {
	const subject = `Accusé de réception — Déclaration des indicateurs ${payload.year}`;
	const body = `
${infoList([
	{ label: "Entreprise (SIREN)", value: formatSiren(payload.siren) },
	{ label: "Année concernée", value: payload.year },
])}
${paragraph("Votre déclaration des indicateurs de l'égalité professionnelle a bien été enregistrée. Le récapitulatif est joint à cet e-mail.")}
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
			intro: "Nous accusons réception de votre déclaration des indicateurs.",
			body,
		}),
	};
};
