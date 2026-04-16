import { formatSiren } from "~/modules/domain";
import type { ReceiptContext } from "../types";
import { escapeHtml, wrapEmail } from "./shell";

export function buildDeclarationReceipt({ siren, year }: ReceiptContext) {
	const subject = `Accusé de réception — Déclaration des indicateurs ${year}`;
	const prettySiren = formatSiren(siren);
	const html = wrapEmail(
		subject,
		`<p>Bonjour,</p>
<p>Nous accusons réception de votre déclaration des indicateurs de l'égalité professionnelle pour l'année <strong>${year}</strong>.</p>
<ul>
<li><strong>Entreprise (SIREN)&nbsp;:</strong> ${escapeHtml(prettySiren)}</li>
<li><strong>Année de déclaration&nbsp;:</strong> ${year}</li>
</ul>
<p>Le récapitulatif de votre déclaration est joint à cet e-mail.</p>
<p>Cordialement,<br>L'équipe Egapro</p>`,
	);

	return { subject, html };
}
