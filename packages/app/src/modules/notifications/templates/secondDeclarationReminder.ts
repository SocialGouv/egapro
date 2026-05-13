import { formatSiren } from "~/modules/domain";
import type { SecondDeclarationReminderPayload } from "../types";
import { escapeHtml, formatFrenchDate, wrapEmail } from "./shell";

export function buildSecondDeclarationReminderTemplate(
	payload: SecondDeclarationReminderPayload,
) {
	const subject = `Rappel — Seconde déclaration à transmettre (${payload.year})`;
	const prettySiren = formatSiren(payload.siren);
	const deadline = formatFrenchDate(payload.deadlineIso);
	const html = wrapEmail(
		subject,
		`<p>Bonjour,</p>
<p>Votre entreprise <strong>${escapeHtml(prettySiren)}</strong> doit transmettre sa seconde déclaration pour la campagne <strong>${payload.year}</strong>.</p>
<p><strong>Date limite&nbsp;:</strong> ${escapeHtml(deadline)}</p>
<p>Connectez-vous à votre espace Egapro pour finaliser la transmission.</p>
<p>Cordialement,<br>L'équipe Egapro</p>`,
	);

	return { subject, html };
}
