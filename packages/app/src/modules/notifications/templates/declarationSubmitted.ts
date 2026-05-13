import { formatSiren } from "~/modules/domain";
import type { DeclarationSubmittedPayload } from "../types";
import { escapeHtml, wrapEmail } from "./shell";

export function buildDeclarationSubmittedTemplate(
	payload: DeclarationSubmittedPayload,
) {
	const subject = `Confirmation — Déclaration des indicateurs ${payload.year}`;
	const prettySiren = formatSiren(payload.siren);
	const html = wrapEmail(
		subject,
		`<p>Bonjour,</p>
<p>Votre déclaration des indicateurs de l'égalité professionnelle pour l'année <strong>${payload.year}</strong> a bien été soumise.</p>
<ul>
<li><strong>Entreprise (SIREN)&nbsp;:</strong> ${escapeHtml(prettySiren)}</li>
<li><strong>Année de déclaration&nbsp;:</strong> ${payload.year}</li>
</ul>
<p>Vous pouvez retrouver le détail dans votre espace Egapro.</p>
<p>Cordialement,<br>L'équipe Egapro</p>`,
	);

	return { subject, html };
}
