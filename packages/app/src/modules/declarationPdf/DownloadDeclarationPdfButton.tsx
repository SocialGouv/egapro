"use client";

export function DownloadDeclarationPdfButton() {
	return (
		<a
			className="fr-btn fr-btn--secondary fr-btn--icon-left fr-icon-file-pdf-line"
			download
			href="/api/declaration-pdf"
		>
			Télécharger le récapitulatif (PDF)
		</a>
	);
}
