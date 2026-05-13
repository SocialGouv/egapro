import { formatFrenchDate, formatSiren, getPublicUrl } from "./helpers.js";
import {
	calloutWarning,
	ctaButton,
	infoList,
	paragraph,
	wrapEmail,
} from "./shell.js";
import type { MailBuilder } from "./types.js";

export const buildSecondDeclarationReminderMail: MailBuilder<
	"second_declaration_reminder"
> = (payload) => {
	const subject = `Rappel — Seconde déclaration à transmettre (${payload.year})`;
	const body = `
${infoList([
	{ label: "Entreprise (SIREN)", value: formatSiren(payload.siren) },
	{ label: "Année de déclaration", value: payload.year },
	{ label: "Date limite", value: formatFrenchDate(payload.deadlineIso) },
])}
${calloutWarning(
	"En l'absence de transmission avant la date limite, votre entreprise s'expose aux mesures prévues par la réglementation.",
)}
${ctaButton({
	label: "Finaliser ma seconde déclaration",
	href: `${getPublicUrl()}/mon-espace`,
})}
${paragraph("Cordialement,<br>L'équipe Egapro")}
`;
	return {
		subject,
		html: wrapEmail({
			title: subject,
			intro:
				"Votre seconde déclaration n'a pas encore été transmise pour cette campagne.",
			body,
		}),
	};
};
