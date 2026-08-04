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
	significant: boolean;
	level: GapLevel;
	triggers: boolean;
};

const GAP_CASES: GapCase[] = [
	{
		label: "no gap (G = 0%)",
		gap: 0,
		significant: false,
		level: "low",
		triggers: false,
	},
	{
		label: "gap ≥ threshold on the first 6 indicators only (G below threshold)",
		gap: GAP_ALERT_THRESHOLD - 1,
		significant: false,
		level: "low",
		triggers: false,
	},
	{
		label: "G gap exactly at the threshold",
		gap: GAP_ALERT_THRESHOLD,
		significant: true,
		level: "high",
		triggers: true,
	},
	{
		label: "G gap above the threshold",
		gap: GAP_ALERT_THRESHOLD + 1,
		significant: true,
		level: "high",
		triggers: true,
	},
	{
		label: "negative G gap at the threshold (unfavourable to men)",
		gap: -GAP_ALERT_THRESHOLD,
		significant: true,
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

		// Indicator G applies to the voluntary tier (< 50, 7-indicator volunteering,
		// #4043) every year, in the annual regime from 250 every year, and in the
		// triennial band 150-249 only during a triennial year.
		const expectedIndicatorG =
			workforce < COMPANY_SIZE_VOLUNTARY_MAX ||
			workforce >= INDICATOR_G_ANNUAL_MIN ||
			(workforce >= INDICATOR_G_TRIENNIAL_MIN && regime.isTriennial);
		const hasIndicatorG = isIndicatorGRequired(workforce, regime.year);
		expect(hasIndicatorG).toBe(expectedIndicatorG);

		// Gap significance and display level are bidirectional, and since #3963
		// they are the same predicate: a gap is significant iff its level is high.
		expect(gapLevel(gapCase.gap) === "high").toBe(gapCase.significant);
		expect(gapLevel(gapCase.gap)).toBe(gapCase.level);

		// The phase-2 compliance process needs >= 100 employees, a computed
		// indicator G, and a significant indicator-G gap in either direction.
		const expectedCompliance =
			workforce >= COMPANY_SIZE_ANNUAL_MIN && hasIndicatorG && gapCase.triggers;
		const compliance = isComplianceProcessRequired({
			workforce,
			hasIndicatorG,
			hasSignificantIndicatorGGap: gapCase.significant,
		});
		expect(compliance).toBe(expectedCompliance);

		// Whenever the process fires, the canonical predicates must agree: the size
		// already forces a CSE, indicator G is computed, and the gap is high.
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

	it("classifyCompanySize: voluntary / mandatory / mandatory_with_compliance boundaries", () => {
		expect(classifyCompanySize(COMPANY_SIZE_VOLUNTARY_MAX - 1)).toBe(
			"voluntary",
		);
		expect(classifyCompanySize(COMPANY_SIZE_VOLUNTARY_MAX)).toBe("mandatory");
		expect(classifyCompanySize(COMPANY_SIZE_ANNUAL_MIN - 1)).toBe("mandatory");
		expect(classifyCompanySize(COMPANY_SIZE_ANNUAL_MIN)).toBe(
			"mandatory_with_compliance",
		);
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

	it("#3934 (CLOSED) — the 50-99 band does not trigger the 7th indicator before the 2030 down-extension", () => {
		// Regression guard: 97 and 70 are in the mandatory 50-99 band, below
		// INDICATOR_G_TRIENNIAL_MIN, so indicator G stays excluded in a pre-2030
		// triennial year (the < 50 volunteering branch does not reach up here).
		expect(isIndicatorGRequired(97, INDICATOR_G_TRIENNIAL_BASE_YEAR)).toBe(
			false,
		);
		expect(isIndicatorGRequired(70, INDICATOR_G_TRIENNIAL_BASE_YEAR)).toBe(
			false,
		);
	});
});

describe("GIP workforce — single source for the obligations (#3929/#3962)", () => {
	it("company absent from the GIP file (null) → no legal obligation but a 7-indicator voluntary declaration", () => {
		const workforce = getObligationWorkforce(null);
		expect(workforce).toBe(0);
		// Obligation predicates stay false: a company with no GIP workforce owes
		// nothing (no CSE, no compliance process).
		expect(isCseRequired(workforce)).toBe(false);
		expect(
			isComplianceProcessRequired({
				workforce,
				hasIndicatorG: false,
				hasSignificantIndicatorGGap: true,
			}),
		).toBe(false);
		// But indicator G is still part of the funnel: a workforce-0 declarant is in
		// the voluntary (< 50) tier, which carries all 7 indicators (#4043).
		expect(
			isIndicatorGRequired(workforce, INDICATOR_G_TRIENNIAL_BASE_YEAR),
		).toBe(true);
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

	it("classifies a negative gap at the threshold as high", () => {
		expect(gapLevel(-GAP_ALERT_THRESHOLD)).toBe("high");
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
				hasSignificantIndicatorGGap: false,
			}),
		).toBe(false);
		expect(
			isComplianceProcessRequired({
				workforce: INDICATOR_G_ANNUAL_MIN,
				hasIndicatorG: true,
				hasSignificantIndicatorGGap: false,
			}),
		).toBe(false);
	});

	it("a negative G gap at the threshold triggers the path", () => {
		expect(
			isComplianceProcessRequired({
				workforce: INDICATOR_G_ANNUAL_MIN,
				hasIndicatorG: true,
				hasSignificantIndicatorGGap: true,
			}),
		).toBe(true);
	});
});
