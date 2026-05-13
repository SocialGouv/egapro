import type { CampaignOpeningPayload } from "../types";
import { escapeHtml, formatFrenchDate, wrapEmail } from "./shell";

export function buildCampaignOpeningTemplate(payload: CampaignOpeningPayload) {
	const subject = `Ouverture de la campagne de déclaration ${payload.year}`;
	const deadline = formatFrenchDate(payload.deadlineIso);
	const html = wrapEmail(
		subject,
		`<p>Bonjour,</p>
<p>La campagne de déclaration des indicateurs de l'égalité professionnelle pour l'année <strong>${payload.year}</strong> est désormais ouverte.</p>
<p><strong>Date limite&nbsp;:</strong> ${escapeHtml(deadline)}</p>
<p>Connectez-vous à votre espace Egapro pour démarrer ou poursuivre votre déclaration.</p>
<p>Cordialement,<br>L'équipe Egapro</p>`,
	);

	return { subject, html };
}
