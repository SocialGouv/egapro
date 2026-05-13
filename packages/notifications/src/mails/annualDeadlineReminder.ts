import { formatFrenchDate, formatSiren, getPublicUrl } from "./helpers.js";
import {
	calloutWarning,
	ctaButton,
	infoList,
	paragraph,
	wrapEmail,
} from "./shell.js";
import type { MailBuilder } from "./types.js";

export const buildAnnualDeadlineReminderMail: MailBuilder<
	"annual_deadline_reminder"
> = (payload) => {
	const subject = `Rappel — Échéance déclaration annuelle (${payload.year})`;
	const body = `
${infoList([
	{ label: "Entreprise (SIREN)", value: formatSiren(payload.siren) },
	{ label: "Année de déclaration", value: payload.year },
	{ label: "Date limite", value: formatFrenchDate(payload.deadlineIso) },
])}
${calloutWarning(
	"La date limite de transmission approche. Pensez à finaliser votre déclaration pour éviter toute pénalité.",
)}
${ctaButton({
	label: "Finaliser ma déclaration",
	href: `${getPublicUrl()}/mon-espace`,
})}
${paragraph("Cordialement,<br>L'équipe Egapro")}
`;
	return {
		subject,
		html: wrapEmail({
			title: subject,
			intro: `La date limite de déclaration des indicateurs pour la campagne ${payload.year} approche.`,
			body,
		}),
	};
};
