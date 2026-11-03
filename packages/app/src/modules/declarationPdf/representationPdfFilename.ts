export function representationPdfFilename(
	siren: string,
	campaignYear: number,
): string {
	return `representation-equilibree-${siren}-${campaignYear}.pdf`;
}
