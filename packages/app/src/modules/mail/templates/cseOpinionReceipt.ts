import { formatSiren } from "~/modules/domain";
import type { ReceiptContext } from "../types";
import { escapeHtml, wrapEmail } from "./shell";

export function buildCseOpinionReceipt({ siren, year }: ReceiptContext) {
	const subject = `Accusé de réception — Avis du CSE ${year}`;
	const prettySiren = formatSiren(siren);
	const html = wrapEmail(
		subject,
		`<p>Bonjour,</p>
<p>Nous accusons réception du dépôt de l'avis du CSE sur les indicateurs de l'égalité professionnelle pour l'année <strong>${year}</strong>.</p>
<ul>
<li><strong>Entreprise (SIREN)&nbsp;:</strong> ${escapeHtml(prettySiren)}</li>
<li><strong>Année de déclaration&nbsp;:</strong> ${year}</li>
</ul>
<p>Cordialement,<br>L'équipe Egapro</p>`,
	);

	return { subject, html };
}
