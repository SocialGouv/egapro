import { resolveGipReferencePeriod } from "~/modules/domain";

import { TooltipButton } from "./TooltipButton";

/**
 * Source attribution line shown under tables when GIP DSN data is available.
 * Displays the DSN data source and the reference period — the GIP data-collection
 * window when available, falling back to the campaign civil year.
 */
type Props = {
	periodStart: string | null | undefined;
	periodEnd: string | null | undefined;
	year: number;
	tooltipId?: string;
};

export function PrefillSource({
	periodStart,
	periodEnd,
	year,
	tooltipId = "tooltip-source",
}: Props) {
	return (
		<p className="fr-text--sm fr-text-mention--grey fr-mb-0">
			Source&nbsp;: DSN (Déclarations Sociales Nominatives), période de
			référence&nbsp;: {resolveGipReferencePeriod(periodStart, periodEnd, year)}
			.
			<TooltipButton
				id={tooltipId}
				label="Information sur la source des données"
			/>
		</p>
	);
}
