import { TooltipButton } from "./TooltipButton";

/**
 * Source attribution line shown under tables when GIP DSN data is available.
 * Displays the DSN data source and last update date with a tooltip.
 */
type Props = {
	periodEnd: string | null;
	tooltipId?: string;
};

export function PrefillSource({
	periodEnd,
	tooltipId = "tooltip-source",
}: Props) {
	return (
		<p className="fr-text--sm fr-text-mention--grey fr-mb-0">
			Source&nbsp;: DSN (Déclarations Sociales Nominatives)
			{periodEnd && `, mise à jour le ${formatFrenchDate(periodEnd)}`}.
			<TooltipButton
				id={tooltipId}
				label="Information sur la source des données"
			/>
		</p>
	);
}

/** Format "2026-12-31" → "31/12/2026" */
function formatFrenchDate(isoDate: string): string {
	const parts = isoDate.split("-");
	if (parts.length !== 3) return isoDate;
	return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
