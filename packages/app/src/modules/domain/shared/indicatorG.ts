import { COMPANY_SIZE_VOLUNTARY_MAX } from "./constants";

export const INDICATOR_G_ANNUAL_MIN = 250;
export const INDICATOR_G_TRIENNIAL_MIN = 150;
export const INDICATOR_G_UNIVERSAL_YEAR = 2030;
export const INDICATOR_G_TRIENNIAL_BASE_YEAR = 2027;

export function isTriennialYear(year: number): boolean {
	return (
		year >= INDICATOR_G_TRIENNIAL_BASE_YEAR &&
		(year - INDICATOR_G_TRIENNIAL_BASE_YEAR) % 3 === 0
	);
}

export function isIndicatorGRequired(workforce: number, year: number): boolean {
	if (workforce >= INDICATOR_G_ANNUAL_MIN) return true;
	if (year >= INDICATOR_G_UNIVERSAL_YEAR) {
		// From 2030 the obligation extends down to every mandatory tier (>= 50), on the triennial cadence.
		return workforce >= COMPANY_SIZE_VOLUNTARY_MAX && isTriennialYear(year);
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
