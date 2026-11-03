// Recharts colours legend text with the series colour, which can be a light background token: keep it for the swatch only.
export function renderLegendLabel(value: string) {
	return <span className="fr-text-default--grey">{value}</span>;
}
