import type {
	CompanySize,
	CompanySizeRange,
	ObservatoryWorkforceRange,
} from "../types";
import {
	COMPANY_SIZE_ANNUAL_MIN,
	COMPANY_SIZE_VOLUNTARY_MAX,
} from "./constants";

/**
 * Classify a company by workforce size into its obligation package.
 * `voluntary` (< 50): voluntary declaration; `mandatory` (50-99): annual declaration
 * without gap-alert obligations; `mandatory_with_compliance` (>= 100): annual
 * declaration + CSE opinion + gap-alert (>= 5%) obligations.
 */
export function classifyCompanySize(workforce: number): CompanySize {
	if (workforce < COMPANY_SIZE_VOLUNTARY_MAX) return "voluntary";
	if (workforce < COMPANY_SIZE_ANNUAL_MIN) return "mandatory";
	return "mandatory_with_compliance";
}

/** Returns true if the company is large enough to require CSE opinions (>= 100 employees). */
export function isCseRequired(workforce: number): boolean {
	return workforce >= COMPANY_SIZE_ANNUAL_MIN;
}

/**
 * Workforce range buckets shared by admin and public statistics filters.
 * `max: null` means the bucket is open-ended (no upper bound).
 * Insertion order matches the expected UI order.
 */
export const COMPANY_SIZE_RANGES: Record<
	CompanySizeRange,
	{ min: number; max: number | null; label: string }
> = {
	"<50": { min: 0, max: 49, label: "Moins de 50 salariés" },
	"50-99": { min: 50, max: 99, label: "50 à 99 salariés" },
	"100-149": { min: 100, max: 149, label: "100 à 149 salariés" },
	"150-249": { min: 150, max: 249, label: "150 à 249 salariés" },
	"250+": { min: 250, max: null, label: "250 salariés et plus" },
};

/**
 * Map a workforce headcount to its `CompanySizeRange` bucket key, for a headcount
 * that may be unknown. An unknown headcount belongs to no bucket: it is never
 * folded into `<50`, which would assert a size the source does not give.
 */
export function getOptionalCompanySizeRange(
	workforce: number | null,
): CompanySizeRange | undefined {
	return workforce === null ? undefined : getCompanySizeRange(workforce);
}

/** Map a workforce headcount to its `CompanySizeRange` bucket key. */
export function getCompanySizeRange(workforce: number): CompanySizeRange {
	const entry = (
		Object.entries(COMPANY_SIZE_RANGES) as Array<
			[CompanySizeRange, (typeof COMPANY_SIZE_RANGES)[CompanySizeRange]]
		>
	).find(
		([, { min, max }]) =>
			workforce >= min && (max === null || workforce <= max),
	);

	return entry ? entry[0] : "<50";
}

/**
 * Workforce brackets of the public observatory search facet, in UI order.
 *
 * Separate from {@link COMPANY_SIZE_RANGES} on purpose: the statistics
 * dashboards need 100-149 and 150-249 apart to track the CSE threshold, while
 * the observatory groups them and caps the last bucket at 1000. Merging the two
 * would force one audience to read the other's boundaries.
 */
export const OBSERVATORY_WORKFORCE_RANGES: Record<
	ObservatoryWorkforceRange,
	{ min: number; max: number | null; label: string }
> = {
	"<50": { min: 0, max: 49, label: "Moins de 50" },
	"50-99": { min: 50, max: 99, label: "De 50 à 99" },
	"100-249": { min: 100, max: 249, label: "De 100 à 249" },
	"250-999": { min: 250, max: 999, label: "De 250 à 999" },
	"1000+": { min: 1000, max: null, label: "Plus de 1000" },
};

export const OBSERVATORY_WORKFORCE_RANGE_KEYS = Object.keys(
	OBSERVATORY_WORKFORCE_RANGES,
) as ObservatoryWorkforceRange[];

/** True when `value` is one of the observatory workforce bracket keys. */
export function isObservatoryWorkforceRange(
	value: string,
): value is ObservatoryWorkforceRange {
	return value in OBSERVATORY_WORKFORCE_RANGES;
}

/**
 * Bracket label for a headcount, as shown on an observatory result card
 * ("De 50 à 99"). An unknown headcount has no bracket — it is never folded into
 * the smallest one, which would assert a size the source does not give.
 */
export function formatObservatoryWorkforce(
	workforce: number | null,
): string | null {
	if (workforce === null) return null;
	const entry = OBSERVATORY_WORKFORCE_RANGE_KEYS.map(
		(key) => OBSERVATORY_WORKFORCE_RANGES[key],
	).find(
		({ min, max }) => workforce >= min && (max === null || workforce <= max),
	);
	return entry?.label ?? null;
}
