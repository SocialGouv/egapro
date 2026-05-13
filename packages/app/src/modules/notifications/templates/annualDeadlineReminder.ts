import { formatSiren } from "~/modules/domain";
import type { AnnualDeadlineReminderPayload } from "../types";
import { escapeHtml, formatFrenchDate, wrapEmail } from "./shell";

export function buildAnnualDeadlineReminderTemplate(
	payload: AnnualDeadlineReminderPayload,
) {
	const subject = `Rappel — Échéance déclaration annuelle (${payload.year})`;
	const prettySiren = formatSiren(payload.siren);
	const deadline = formatFrenchDate(payload.deadlineIso);
	const html = wrapEmail(
		subject,
		`<p>Bonjour,</p>
<p>La date limite de déclaration des indicateurs de l'égalité professionnelle approche pour la campagne <strong>${payload.year}</strong>.</p>
<ul>
<li><strong>Entreprise (SIREN)&nbsp;:</strong> ${escapeHtml(prettySiren)}</li>
<li><strong>Date limite&nbsp;:</strong> ${escapeHtml(deadline)}</li>
</ul>
<p>Connectez-vous à votre espace Egapro pour finaliser votre déclaration.</p>
<p>Cordialement,<br>L'équipe Egapro</p>`,
	);

	return { subject, html };
}
