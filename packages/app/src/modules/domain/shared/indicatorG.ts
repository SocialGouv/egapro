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
	if (year >= INDICATOR_G_UNIVERSAL_YEAR) {
		return workforce >= INDICATOR_G_ANNUAL_MIN;
	}
	if (workforce >= INDICATOR_G_ANNUAL_MIN) return true;
	if (
		workforce >= INDICATOR_G_TRIENNIAL_MIN &&
		workforce < INDICATOR_G_ANNUAL_MIN
	) {
		return isTriennialYear(year);
	}
	return false;
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
