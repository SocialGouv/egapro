import { formatSiren, getPublicUrl } from "./helpers.js";
import type { MailBuilder } from "./types.js";
import { ctaButton, infoList, paragraph, wrapEmail } from "./view/shell.js";

export const buildSecondDeclarationConfirmationMail: MailBuilder<
	"second_declaration_confirmation"
> = (payload) => {
	const subject = `Accusé de réception — Seconde déclaration ${payload.year}`;
	const body = `
${infoList([
	{ label: "Entreprise (SIREN)", value: formatSiren(payload.siren) },
	{ label: "Année concernée", value: payload.year },
])}
${paragraph("Votre seconde déclaration de l'indicateur d'écart de rémunération par catégorie de salariés a bien été enregistrée. Le récapitulatif est joint à cet e-mail.")}
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
			intro: "Nous accusons réception de votre seconde déclaration.",
			body,
		}),
	};
};
