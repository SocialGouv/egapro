const PERCENT_FORMAT: Intl.NumberFormatOptions = { maximumFractionDigits: 2 };

export const MISSING_VALUE = "—";

/** Percentage from a 0-1 ratio — the shape every gap column is stored in. */
export function formatGap(ratio: number | null): string {
	if (ratio === null) return MISSING_VALUE;
	return `${(ratio * 100).toLocaleString("fr-FR", PERCENT_FORMAT)} %`;
}

/** Percentage from a value already expressed on a 0-100 scale. */
export function formatPercent(value: number | null): string {
	if (value === null) return MISSING_VALUE;
	return `${value.toLocaleString("fr-FR", PERCENT_FORMAT)} %`;
}

export function formatCount(value: number | null): string {
	if (value === null) return MISSING_VALUE;
	return Math.round(value).toLocaleString("fr-FR");
}

/** Share of `part` in `total`, on a 0-100 scale, or null when undecidable. */
export function shareOf(
	part: number | null,
	total: number | null,
): number | null {
	if (part === null || total === null || total === 0) return null;
	return (part / total) * 100;
}

export type CompanyLocation = { label: string; value: string };

/**
 * Where a company sits, as both screens of the observatory name it. A company
 * registered abroad has no French département, and a non-diffusible one keeps
 * its département and region even though its street address is withheld.
 */
export function companyLocation(company: {
	countryLabel: string | null;
	departmentLabel: string | null;
	region: string | null;
}): CompanyLocation | null {
	if (company.countryLabel) {
		return { label: "Pays", value: company.countryLabel };
	}
	const value = [company.departmentLabel, company.region]
		.filter(Boolean)
		.join(", ");
	return value ? { label: "Adresse", value } : null;
}

export type GapDirection = {
	/** Sentence up to the emphasised word, e.g. "Écart en faveur des ". */
	prefix: string;
	/** The emphasised word, e.g. "hommes"; empty when there is nothing to stress. */
	emphasis: string;
};

/**
 * A positive gap means men are paid more — the sign convention of every
 * `*Gap` column. Rendered as "Écart en faveur des **hommes**".
 */
export function gapDirection(ratio: number | null): GapDirection {
	if (ratio === null) return { prefix: "Donnée non disponible", emphasis: "" };
	if (ratio > 0) return { prefix: "Écart en faveur des ", emphasis: "hommes" };
	if (ratio < 0) return { prefix: "Écart en faveur des ", emphasis: "femmes" };
	return { prefix: "Aucun écart constaté", emphasis: "" };
}
