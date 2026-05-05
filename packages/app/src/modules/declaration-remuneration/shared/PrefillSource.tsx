type Props = {
	periodStart?: string | null;
	periodEnd: string | null;
};

export function PrefillSource({ periodStart, periodEnd }: Props) {
	const suffix = buildSuffix(periodStart, periodEnd);
	return (
		<p className="fr-text--sm fr-text-mention--grey fr-mb-0">
			Source&nbsp;: DSN (Déclarations Sociales Nominatives)
			{suffix}.
		</p>
	);
}

function buildSuffix(
	periodStart: string | null | undefined,
	periodEnd: string | null,
): string {
	if (periodStart && periodEnd) {
		return `, période de référence : ${formatFrenchDate(periodStart)} - ${formatFrenchDate(periodEnd)}`;
	}
	if (periodEnd) {
		return `, mise à jour le ${formatFrenchDate(periodEnd)}`;
	}
	return "";
}

/** Format "2026-12-31" → "31/12/2026" */
function formatFrenchDate(isoDate: string): string {
	const parts = isoDate.split("-");
	if (parts.length !== 3) return isoDate;
	return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
