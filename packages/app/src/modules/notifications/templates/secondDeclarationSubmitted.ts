import { formatSiren } from "~/modules/domain";
import type { SecondDeclarationSubmittedPayload } from "../types";
import { escapeHtml, wrapEmail } from "./shell";

export function buildSecondDeclarationSubmittedTemplate(
	payload: SecondDeclarationSubmittedPayload,
) {
	const subject = `Confirmation — Seconde déclaration ${payload.year}`;
	const prettySiren = formatSiren(payload.siren);
	const html = wrapEmail(
		subject,
		`<p>Bonjour,</p>
<p>Votre seconde déclaration des indicateurs de l'égalité professionnelle pour l'année <strong>${payload.year}</strong> a bien été enregistrée.</p>
<ul>
<li><strong>Entreprise (SIREN)&nbsp;:</strong> ${escapeHtml(prettySiren)}</li>
<li><strong>Année de déclaration&nbsp;:</strong> ${payload.year}</li>
</ul>
<p>Vous restez tenus aux obligations complémentaires liées à l'écart constaté (mesures de correction, suivi annuel).</p>
<p>Cordialement,<br>L'équipe Egapro</p>`,
	);

	return { subject, html };
}
