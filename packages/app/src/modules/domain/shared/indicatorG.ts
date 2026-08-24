import { alignCampaignYear } from "./campaignAlignment";
import { COMPANY_SIZE_VOLUNTARY_MAX } from "./constants";

export const INDICATOR_G_ANNUAL_MIN = 250;
export const INDICATOR_G_TRIENNIAL_MIN = 150;
export const INDICATOR_G_UNIVERSAL_YEAR = 2030;
export const INDICATOR_G_TRIENNIAL_BASE_YEAR = 2027;

export function isTriennialYear(year: number): boolean {
	const aligned = alignCampaignYear(year);
	return (
		aligned >= INDICATOR_G_TRIENNIAL_BASE_YEAR &&
		(aligned - INDICATOR_G_TRIENNIAL_BASE_YEAR) % 3 === 0
	);
}

/**
 * Whether indicator G is required within a declaration for this workforce and campaign year.
 * Whether the company must declare at all is `isObligatedForYear` — a voluntary (< 50)
 * declaration still carries all 7 indicators (2026-07 business arbitrage).
 */
export function isIndicatorGRequired(workforce: number, year: number): boolean {
	// Voluntary tier (< 50): the declaration always carries all 7 indicators
	// (2026-07 arbitrage). Scheme property with no year cadence, like the >= 250 branch.
	if (workforce < COMPANY_SIZE_VOLUNTARY_MAX) return true;
	if (workforce >= INDICATOR_G_ANNUAL_MIN) return true;
	if (year >= INDICATOR_G_UNIVERSAL_YEAR) {
		// From 2030 the obligation extends down to every mandatory tier (>= 50), on the triennial cadence.
		return isTriennialYear(year);
	}
	return workforce >= INDICATOR_G_TRIENNIAL_MIN && isTriennialYear(year);
}

type IndicatorCode = "A" | "B" | "C" | "D" | "E" | "F" | "G";

const BASE_INDICATORS: ReadonlyArray<IndicatorCode> = [
	"A",
	"B",
	"C",
	"D",
	"E",
	"F",
] as const;

export function getApplicableIndicators(
	workforce: number,
	year: number,
): { indicators: ReadonlyArray<IndicatorCode> } {
	const indicators: IndicatorCode[] = [...BASE_INDICATORS];
	if (isIndicatorGRequired(workforce, year)) {
		indicators.push("G");
	}
	return { indicators };
}
