export function jointEvaluationPdfFilename(
	siren: string,
	year: number,
): string {
	return `evaluation-conjointe-${siren}-${year}.pdf`;
}
