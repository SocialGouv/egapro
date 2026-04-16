import { formatSiren } from "~/modules/domain";
import type { ReceiptContext } from "../types";
import { escapeHtml, wrapEmail } from "./shell";

export function buildSecondDeclarationReceipt({ siren, year }: ReceiptContext) {
	const subject = `Accusé de réception — Seconde déclaration ${year}`;
	const prettySiren = formatSiren(siren);
	const html = wrapEmail(
		subject,
		`<p>Bonjour,</p>
<p>Nous accusons réception de votre seconde déclaration de l'indicateur par catégorie de salariés pour l'année <strong>${year}</strong>.</p>
<ul>
<li><strong>Entreprise (SIREN)&nbsp;:</strong> ${escapeHtml(prettySiren)}</li>
<li><strong>Année de déclaration&nbsp;:</strong> ${year}</li>
</ul>
<p>Le récapitulatif de votre seconde déclaration est joint à cet e-mail.</p>
<p>Cordialement,<br>L'équipe Egapro</p>`,
	);

	return { subject, html };
}
