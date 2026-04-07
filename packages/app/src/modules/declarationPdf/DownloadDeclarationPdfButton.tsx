type Props = {
	year?: number;
};

export function DownloadDeclarationPdfButton({ year }: Props) {
	const href = year
		? `/api/declaration-pdf?year=${year}`
		: "/api/declaration-pdf";

	return (
		<a
			className="fr-btn fr-btn--secondary fr-btn--icon-left fr-icon-file-pdf-line"
			download
			href={href}
		>
			Télécharger le récapitulatif (PDF)
		</a>
	);
}
