import { describe, expect, it } from "vitest";
import type { GapLevel } from "~/modules/domain";
import {
	COMPANY_SIZE_ANNUAL_MIN,
	COMPANY_SIZE_VOLUNTARY_MAX,
	classifyCompanySize,
	GAP_ALERT_THRESHOLD,
	gapLevel,
	getObligationWorkforce,
	INDICATOR_G_ANNUAL_MIN,
	INDICATOR_G_TRIENNIAL_BASE_YEAR,
	INDICATOR_G_TRIENNIAL_MIN,
	INDICATOR_G_UNIVERSAL_YEAR,
	isComplianceProcessRequired,
	isCseRequired,
	isIndicatorGRequired,
	isTriennialYear,
	parseGipWorkforce,
	toDisplayWorkforce,
} from "~/modules/domain";

// Boundary-focused GIP workforce values (the single obligation source, #3962),
// all derived from the named regulatory thresholds so no headcount magic number appears in the matrix.
const GIP_WORKFORCES = [
	COMPANY_SIZE_VOLUNTARY_MAX - 1, // 49
	COMPANY_SIZE_VOLUNTARY_MAX, // 50
	COMPANY_SIZE_ANNUAL_MIN - 1, // 99
	COMPANY_SIZE_ANNUAL_MIN, // 100
	INDICATOR_G_TRIENNIAL_MIN - 1, // 149
	INDICATOR_G_TRIENNIAL_MIN, // 150
	INDICATOR_G_TRIENNIAL_MIN + 1, // 151
	INDICATOR_G_ANNUAL_MIN - 1, // 249
	INDICATOR_G_ANNUAL_MIN, // 250
	INDICATOR_G_ANNUAL_MIN + 1, // 251
];

type GapCase = {
	label: string;
	gap: number;
	level: GapLevel;
	triggers: boolean;
};

const GAP_CASES: GapCase[] = [
	{
		label: "no gap (G = 0%)",
		gap: 0,
		level: "low",
		triggers: false,
	},
	{
		label: "gap ≥ threshold on the first 6 indicators only (G below threshold)",
		gap: GAP_ALERT_THRESHOLD - 1,
		level: "low",
		triggers: false,
	},
	{
		label: "G gap exactly at the threshold",
		gap: GAP_ALERT_THRESHOLD,
		level: "high",
		triggers: true,
	},
	{
		label: "G gap above the threshold",
		gap: GAP_ALERT_THRESHOLD + 1,
		level: "high",
		triggers: true,
	},
	{
		// #3963 — symmetric threshold: a gap unfavourable to men triggers the path like the positive one.
		label: "negative G gap at the threshold (unfavourable to men)",
		gap: -GAP_ALERT_THRESHOLD,
		level: "high",
		triggers: true,
	},
];

// Both years stay below INDICATOR_G_UNIVERSAL_YEAR so the 150-249 band remains
// gated on the triennial cadence (the 2030+ down-extension is out of scope here).
const REGIMES = [
	{
		year: INDICATOR_G_TRIENNIAL_BASE_YEAR, // 2027
		isTriennial: true,
		label: "triennial year",
	},
	{
		year: INDICATOR_G_TRIENNIAL_BASE_YEAR + 1, // 2028
		isTriennial: false,
		label: "non-triennial year (annual regime only)",
	},
];

type Row = {
	label: string;
	gipWorkforce: number;
	gapCase: GapCase;
	regime: (typeof REGIMES)[number];
};

const ROWS: Row[] = [];
for (const gipWorkforce of GIP_WORKFORCES) {
	for (const gapCase of GAP_CASES) {
		for (const regime of REGIMES) {
			ROWS.push({
				label: `GIP workforce ${gipWorkforce} · ${gapCase.label} · ${regime.label}`,
				gipWorkforce,
				gapCase,
				regime,
			});
		}
	}
}

// The CSE dimension (hasCse × hasSubmittedCseOpinion) lives in
// fsmMirrors.conformance.test.ts, where the mirror functions actually consume it.
// None of the predicates exercised here read hasCse, so crossing it in would only
// duplicate rows and add a tautological assertion — it is deliberately left out.
describe("decision table — workforce × gap × regime", () => {
	it.each(ROWS)("$label", ({ gipWorkforce, gapCase, regime }) => {
		// Fixture guard: both regimes stay below the universal year so the 150-249
		// band remains triennial-gated.
		expect(regime.year).toBeLessThan(INDICATOR_G_UNIVERSAL_YEAR);

		// Same composition as production (#3962): the GIP workforce is the single source feeding every obligation predicate.
		const workforce = getObligationWorkforce(gipWorkforce);

		// The CSE-opinion mandate is size-based (>= 100) and ignores the declared CSE.
		const cseBySize = workforce >= COMPANY_SIZE_ANNUAL_MIN;
		expect(isCseRequired(workforce)).toBe(cseBySize);

		// Indicator G applies in the annual regime from 250 every year, and in the
		// triennial band 150-249 only during a triennial year.
		const expectedIndicatorG =
			workforce >= INDICATOR_G_ANNUAL_MIN ||
			(workforce >= INDICATOR_G_TRIENNIAL_MIN && regime.isTriennial);
		const hasIndicatorG = isIndicatorGRequired(workforce, regime.year);
		expect(hasIndicatorG).toBe(expectedIndicatorG);

		// #3963 — the display level is symmetric: a gap is classified by absolute
		// magnitude, so both directions share the same expected level.
		expect(gapLevel(gapCase.gap)).toBe(gapCase.level);

		// The phase-2 compliance process needs >= 100 employees, a computed
		// indicator G, and an indicator-G gap whose magnitude reaches the threshold.
		const expectedCompliance =
			workforce >= COMPANY_SIZE_ANNUAL_MIN && hasIndicatorG && gapCase.triggers;
		const compliance = isComplianceProcessRequired({
			workforce,
			hasIndicatorG,
			gap: gapCase.gap,
		});
		expect(compliance).toBe(expectedCompliance);

		// Whenever the process fires, the canonical predicates must agree: the size
		// already forces a CSE, indicator G is computed, and the gap is high (either direction).
		if (compliance) {
			expect(isCseRequired(workforce)).toBe(true);
			expect(hasIndicatorG).toBe(true);
			expect(gapLevel(gapCase.gap)).toBe("high");
		}
	});
});

describe("size boundaries (named domain constants)", () => {
	it("isCseRequired flips at COMPANY_SIZE_ANNUAL_MIN (100)", () => {
		expect(isCseRequired(COMPANY_SIZE_ANNUAL_MIN - 1)).toBe(false);
		expect(isCseRequired(COMPANY_SIZE_ANNUAL_MIN)).toBe(true);
		expect(isCseRequired(COMPANY_SIZE_ANNUAL_MIN + 1)).toBe(true);
	});

	it("classifyCompanySize: voluntary / triennial / annual boundaries", () => {
		expect(classifyCompanySize(COMPANY_SIZE_VOLUNTARY_MAX - 1)).toBe(
			"voluntary",
		);
		expect(classifyCompanySize(COMPANY_SIZE_VOLUNTARY_MAX)).toBe("triennial");
		expect(classifyCompanySize(COMPANY_SIZE_ANNUAL_MIN - 1)).toBe("triennial");
		expect(classifyCompanySize(COMPANY_SIZE_ANNUAL_MIN)).toBe("annual");
	});

	it("isIndicatorGRequired: annual regime flips at INDICATOR_G_ANNUAL_MIN (250)", () => {
		const nonTriennial = INDICATOR_G_TRIENNIAL_BASE_YEAR + 1;
		expect(isIndicatorGRequired(INDICATOR_G_ANNUAL_MIN - 1, nonTriennial)).toBe(
			false,
		);
		expect(isIndicatorGRequired(INDICATOR_G_ANNUAL_MIN, nonTriennial)).toBe(
			true,
		);
		expect(isIndicatorGRequired(INDICATOR_G_ANNUAL_MIN + 1, nonTriennial)).toBe(
			true,
		);
	});

	it("isIndicatorGRequired: triennial regime flips at INDICATOR_G_TRIENNIAL_MIN (150) in a triennial year", () => {
		expect(
			isIndicatorGRequired(
				INDICATOR_G_TRIENNIAL_MIN - 1,
				INDICATOR_G_TRIENNIAL_BASE_YEAR,
			),
		).toBe(false);
		expect(
			isIndicatorGRequired(
				INDICATOR_G_TRIENNIAL_MIN,
				INDICATOR_G_TRIENNIAL_BASE_YEAR,
			),
		).toBe(true);
	});

	it("isIndicatorGRequired: the 150-249 band is not required outside a triennial year", () => {
		const nonTriennial = INDICATOR_G_TRIENNIAL_BASE_YEAR + 1;
		expect(isIndicatorGRequired(INDICATOR_G_TRIENNIAL_MIN, nonTriennial)).toBe(
			false,
		);
		expect(isIndicatorGRequired(INDICATOR_G_ANNUAL_MIN - 1, nonTriennial)).toBe(
			false,
		);
	});

	it("isTriennialYear: triennial cycle starting at INDICATOR_G_TRIENNIAL_BASE_YEAR", () => {
		expect(isTriennialYear(INDICATOR_G_TRIENNIAL_BASE_YEAR - 1)).toBe(false);
		expect(isTriennialYear(INDICATOR_G_TRIENNIAL_BASE_YEAR)).toBe(true);
		expect(isTriennialYear(INDICATOR_G_TRIENNIAL_BASE_YEAR + 1)).toBe(false);
		expect(isTriennialYear(INDICATOR_G_TRIENNIAL_BASE_YEAR + 3)).toBe(true);
	});

	it("#3934 (CLOSED) — a workforce < 100 never triggers the 7th indicator", () => {
		// Regression guard: 97 and 70 are below both COMPANY_SIZE_ANNUAL_MIN and
		// INDICATOR_G_TRIENNIAL_MIN, so indicator G must never be required, even in
		// a triennial year.
		expect(isIndicatorGRequired(97, INDICATOR_G_TRIENNIAL_BASE_YEAR)).toBe(
			false,
		);
		expect(isIndicatorGRequired(70, INDICATOR_G_TRIENNIAL_BASE_YEAR)).toBe(
			false,
		);
	});
});

describe("GIP workforce — single source for the obligations (#3929/#3962)", () => {
	it("company absent from the GIP file (null) → no obligation", () => {
		const workforce = getObligationWorkforce(null);
		expect(workforce).toBe(0);
		expect(isCseRequired(workforce)).toBe(false);
		expect(
			isIndicatorGRequired(workforce, INDICATOR_G_TRIENNIAL_BASE_YEAR),
		).toBe(false);
		expect(
			isComplianceProcessRequired({
				workforce,
				hasIndicatorG: false,
				gap: GAP_ALERT_THRESHOLD,
			}),
		).toBe(false);
	});

	it("decimal GIP workforce: thresholds compare the exact value, never the display rounding", () => {
		// #3929 class of bug: 99.97 displays as 99 and must NOT trigger the >= 100 obligations.
		const nearCse = getObligationWorkforce(COMPANY_SIZE_ANNUAL_MIN - 0.03);
		expect(isCseRequired(nearCse)).toBe(false);
		expect(toDisplayWorkforce(nearCse)).toBe(COMPANY_SIZE_ANNUAL_MIN - 1);

		const nearTriennial = getObligationWorkforce(
			INDICATOR_G_TRIENNIAL_MIN - 0.5,
		);
		expect(
			isIndicatorGRequired(nearTriennial, INDICATOR_G_TRIENNIAL_BASE_YEAR),
		).toBe(false);

		const nearAnnual = getObligationWorkforce(INDICATOR_G_ANNUAL_MIN - 0.1);
		const nonTriennial = INDICATOR_G_TRIENNIAL_BASE_YEAR + 1;
		expect(isIndicatorGRequired(nearAnnual, nonTriennial)).toBe(false);
	});

	it("parseGipWorkforce: decimal string accepted, invalid value → null → not subject to obligations", () => {
		expect(parseGipWorkforce("99.97")).toBeCloseTo(99.97);
		expect(parseGipWorkforce(null)).toBeNull();
		expect(parseGipWorkforce("abc")).toBeNull();
		expect(getObligationWorkforce(parseGipWorkforce("abc"))).toBe(0);
	});
});

describe("gap display classification", () => {
	it("gapLevel: boundary at the threshold in both directions + the exact value", () => {
		expect(gapLevel(GAP_ALERT_THRESHOLD - 1)).toBe("low");
		expect(gapLevel(GAP_ALERT_THRESHOLD)).toBe("high");
		expect(gapLevel(GAP_ALERT_THRESHOLD + 1)).toBe("high");
		expect(gapLevel(-(GAP_ALERT_THRESHOLD - 1))).toBe("low");
		expect(gapLevel(-GAP_ALERT_THRESHOLD)).toBe("high");
		expect(gapLevel(-(GAP_ALERT_THRESHOLD + 1))).toBe("high");
		expect(gapLevel(null)).toBe(null);
	});

	it('#3963 — a negative gap at the threshold (unfavourable to men) is classified "high"', () => {
		// The regulatory 5% threshold is symmetric: a gap significant in either
		// direction is « élevé ». gapLevel classifies by absolute magnitude.
		expect(gapLevel(-GAP_ALERT_THRESHOLD)).toBe("high");
	});

	it("#3963 — gapLevel is symmetric: gapLevel(x) === gapLevel(-x)", () => {
		for (const magnitude of [
			0,
			GAP_ALERT_THRESHOLD - 1,
			GAP_ALERT_THRESHOLD,
			GAP_ALERT_THRESHOLD + 1,
			20,
		]) {
			expect(gapLevel(magnitude)).toBe(gapLevel(-magnitude));
		}
	});
});

describe("#3946 (domain side) — the compliance path depends only on the indicator-G gap", () => {
	it("a below-threshold G gap does not require the path, whatever the A-F gaps", () => {
		// #3946's « écart à justifier » shown for A-F-only gaps is a message-layer
		// defect. The domain predicate is correct: it reacts solely to the indicator-G
		// gap, so a below-threshold G gap never triggers the compliance process.
		expect(
			isComplianceProcessRequired({
				workforce: INDICATOR_G_ANNUAL_MIN,
				hasIndicatorG: true,
				gap: GAP_ALERT_THRESHOLD - 1,
			}),
		).toBe(false);
		expect(
			isComplianceProcessRequired({
				workforce: INDICATOR_G_ANNUAL_MIN,
				hasIndicatorG: true,
				gap: 0,
			}),
		).toBe(false);
	});

	it("#3963 — a negative G gap (unfavourable to men) triggers the path (bidirectional obligation)", () => {
		expect(
			isComplianceProcessRequired({
				workforce: INDICATOR_G_ANNUAL_MIN,
				hasIndicatorG: true,
				gap: -GAP_ALERT_THRESHOLD,
			}),
		).toBe(true);
	});

	it("#3963 — isComplianceProcessRequired is symmetric at ±GAP_ALERT_THRESHOLD", () => {
		const base = { workforce: INDICATOR_G_ANNUAL_MIN, hasIndicatorG: true };
		expect(
			isComplianceProcessRequired({ ...base, gap: GAP_ALERT_THRESHOLD }),
		).toBe(isComplianceProcessRequired({ ...base, gap: -GAP_ALERT_THRESHOLD }));
		expect(
			isComplianceProcessRequired({ ...base, gap: GAP_ALERT_THRESHOLD - 1 }),
		).toBe(
			isComplianceProcessRequired({ ...base, gap: -(GAP_ALERT_THRESHOLD - 1) }),
		);
	});
});
