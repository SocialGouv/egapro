import { formatSiren } from "~/modules/domain";
import type { CseOpinionSubmittedPayload } from "../types";
import { escapeHtml, wrapEmail } from "./shell";

export function buildCseOpinionSubmittedTemplate(
	payload: CseOpinionSubmittedPayload,
) {
	const subject = `Confirmation — Avis du CSE transmis (${payload.year})`;
	const prettySiren = formatSiren(payload.siren);
	const html = wrapEmail(
		subject,
		`<p>Bonjour,</p>
<p>Nous accusons réception de la transmission de l'avis du CSE pour votre déclaration <strong>${payload.year}</strong>.</p>
<ul>
<li><strong>Entreprise (SIREN)&nbsp;:</strong> ${escapeHtml(prettySiren)}</li>
<li><strong>Année concernée&nbsp;:</strong> ${payload.year}</li>
</ul>
<p>Cordialement,<br>L'équipe Egapro</p>`,
	);

	return { subject, html };
}
