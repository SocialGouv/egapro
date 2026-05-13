import { formatSiren } from "~/modules/domain";
import type { JointEvaluationSubmittedPayload } from "../types";
import { escapeHtml, wrapEmail } from "./shell";

export function buildJointEvaluationSubmittedTemplate(
	payload: JointEvaluationSubmittedPayload,
) {
	const subject = `Confirmation — Évaluation conjointe transmise (${payload.year})`;
	const prettySiren = formatSiren(payload.siren);
	const html = wrapEmail(
		subject,
		`<p>Bonjour,</p>
<p>Nous accusons réception du dépôt de l'évaluation conjointe pour votre déclaration <strong>${payload.year}</strong>.</p>
<ul>
<li><strong>Entreprise (SIREN)&nbsp;:</strong> ${escapeHtml(prettySiren)}</li>
<li><strong>Année concernée&nbsp;:</strong> ${payload.year}</li>
</ul>
<p>Cordialement,<br>L'équipe Egapro</p>`,
	);

	return { subject, html };
}
