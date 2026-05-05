type Props = {
	year?: number;
	correction?: boolean;
	variant?: "secondary" | "tertiary";
	label?: string;
};

export function DownloadDeclarationPdfButton({
	year,
	correction,
	variant = "secondary",
	label = "Télécharger le récapitulatif (PDF)",
}: Props) {
	const params = new URLSearchParams();
	if (year) params.set("year", String(year));
	if (correction) params.set("type", "correction");
	const query = params.toString();
	const href = query ? `/api/declaration-pdf?${query}` : "/api/declaration-pdf";

	return (
		<a
			className={`fr-btn fr-btn--${variant} fr-btn--icon-left fr-icon-file-pdf-line`}
			download
			href={href}
		>
			{label}
		</a>
	);
}
