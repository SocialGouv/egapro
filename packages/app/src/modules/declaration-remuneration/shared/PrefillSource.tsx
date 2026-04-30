/**
 * Source attribution line shown under tables when GIP DSN data is available.
 * Displays the DSN data source and (optionally) the reference period range.
 */
type Props = {
	periodStart?: string | null;
	periodEnd: string | null;
};

export function PrefillSource({ periodStart, periodEnd }: Props) {
	const showPeriod = periodStart && periodEnd;
	return (
		<div className="fr-text--sm fr-text-mention--grey fr-mb-0">
			<p className="fr-mb-0">
				Source&nbsp;: DSN (Déclarations Sociales Nominatives)
				{periodEnd &&
					!showPeriod &&
					`, mise à jour le ${formatFrenchDate(periodEnd)}`}
				.
			</p>
			{showPeriod && (
				<p className="fr-mb-0">
					Période de référence&nbsp;: {formatFrenchDate(periodStart)} -{" "}
					{formatFrenchDate(periodEnd)}.
				</p>
			)}
		</div>
	);
}

/** Format "2026-12-31" → "31/12/2026" */
function formatFrenchDate(isoDate: string): string {
	const parts = isoDate.split("-");
	if (parts.length !== 3) return isoDate;
	return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
