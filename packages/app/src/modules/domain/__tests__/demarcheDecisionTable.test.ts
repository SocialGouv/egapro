import { describe, expect, it } from "vitest";
import type { GapLevel } from "~/modules/domain";
import {
	COMPANY_SIZE_ANNUAL_MIN,
	COMPANY_SIZE_VOLUNTARY_MAX,
	classifyCompanySize,
	GAP_ALERT_THRESHOLD,
	gapLevel,
	INDICATOR_G_ANNUAL_MIN,
	INDICATOR_G_TRIENNIAL_BASE_YEAR,
	INDICATOR_G_TRIENNIAL_MIN,
	INDICATOR_G_UNIVERSAL_YEAR,
	isComplianceProcessRequired,
	isCseRequired,
	isIndicatorGRequired,
	isSignificantGap,
	isTriennialYear,
} from "~/modules/domain";

// Boundary-focused workforce values, all derived from the named regulatory
// thresholds so no headcount magic number appears in the matrix.
const WORKFORCES = [
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
	// null → display classification deferred to the #3963 describe (negative gap)
	level: GapLevel | null;
	triggers: boolean;
};

const GAP_CASES: GapCase[] = [
	{
		label: "aucun écart (G = 0 %)",
		gap: 0,
		significant: false,
		level: "low",
		triggers: false,
	},
	{
		label: "≥ seuil sur les 6 premiers indicateurs seulement (G sous le seuil)",
		gap: GAP_ALERT_THRESHOLD - 1,
		significant: false,
		level: "low",
		triggers: false,
	},
	{
		label: "écart G pile au seuil",
		gap: GAP_ALERT_THRESHOLD,
		significant: true,
		level: "high",
		triggers: true,
	},
	{
		label: "écart G au-dessus du seuil",
		gap: GAP_ALERT_THRESHOLD + 1,
		significant: true,
		level: "high",
		triggers: true,
	},
	{
		label: "écart G négatif au seuil (défavorable aux hommes)",
		gap: -GAP_ALERT_THRESHOLD,
		significant: true,
		level: null,
		triggers: false,
	},
];

// Both years stay below INDICATOR_G_UNIVERSAL_YEAR so the 150-249 band remains
// gated on the triennial cadence (the 2030+ down-extension is out of scope here).
const REGIMES = [
	{
		year: INDICATOR_G_TRIENNIAL_BASE_YEAR, // 2027
		isTriennial: true,
		label: "année triennale",
	},
	{
		year: INDICATOR_G_TRIENNIAL_BASE_YEAR + 1, // 2028
		isTriennial: false,
		label: "année non triennale (régime annuel seul)",
	},
];

type Row = {
	label: string;
	workforce: number;
	gapCase: GapCase;
	regime: (typeof REGIMES)[number];
};

const ROWS: Row[] = [];
for (const workforce of WORKFORCES) {
	for (const gapCase of GAP_CASES) {
		for (const regime of REGIMES) {
			ROWS.push({
				label: `effectif ${workforce} · ${gapCase.label} · ${regime.label}`,
				workforce,
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
describe("table de décision — effectif × écart × régime", () => {
	it.each(ROWS)("$label", ({ workforce, gapCase, regime }) => {
		// Fixture guard: both regimes stay below the universal year so the 150-249
		// band remains triennial-gated.
		expect(regime.year).toBeLessThan(INDICATOR_G_UNIVERSAL_YEAR);

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

		// Gap significance is bidirectional, while the display level is positive-only,
		// so the negative-gap classification is deferred to the #3963 describe.
		expect(isSignificantGap(gapCase.gap)).toBe(gapCase.significant);
		if (gapCase.level !== null) {
			expect(gapLevel(gapCase.gap)).toBe(gapCase.level);
		}

		// The phase-2 compliance process needs >= 100 employees, a computed
		// indicator G, and a positive indicator-G gap at or above the threshold.
		const expectedCompliance =
			workforce >= COMPANY_SIZE_ANNUAL_MIN && hasIndicatorG && gapCase.triggers;
		const compliance = isComplianceProcessRequired({
			workforce,
			hasIndicatorG,
			gap: gapCase.gap,
		});
		expect(compliance).toBe(expectedCompliance);

		// Whenever the process fires, the canonical predicates must agree: the size
		// already forces a CSE, indicator G is computed, and the gap is a high positive.
		if (compliance) {
			expect(isCseRequired(workforce)).toBe(true);
			expect(hasIndicatorG).toBe(true);
			expect(isSignificantGap(gapCase.gap)).toBe(true);
			expect(gapLevel(gapCase.gap)).toBe("high");
		}
	});
});

describe("frontières de taille (constantes nommées du domaine)", () => {
	it("isCseRequired bascule à COMPANY_SIZE_ANNUAL_MIN (100)", () => {
		expect(isCseRequired(COMPANY_SIZE_ANNUAL_MIN - 1)).toBe(false);
		expect(isCseRequired(COMPANY_SIZE_ANNUAL_MIN)).toBe(true);
		expect(isCseRequired(COMPANY_SIZE_ANNUAL_MIN + 1)).toBe(true);
	});

	it("classifyCompanySize : frontières voluntary / triennial / annual", () => {
		expect(classifyCompanySize(COMPANY_SIZE_VOLUNTARY_MAX - 1)).toBe(
			"voluntary",
		);
		expect(classifyCompanySize(COMPANY_SIZE_VOLUNTARY_MAX)).toBe("triennial");
		expect(classifyCompanySize(COMPANY_SIZE_ANNUAL_MIN - 1)).toBe("triennial");
		expect(classifyCompanySize(COMPANY_SIZE_ANNUAL_MIN)).toBe("annual");
	});

	it("isIndicatorGRequired : régime annuel bascule à INDICATOR_G_ANNUAL_MIN (250)", () => {
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

	it("isIndicatorGRequired : régime triennal bascule à INDICATOR_G_TRIENNIAL_MIN (150) une année triennale", () => {
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

	it("isIndicatorGRequired : la bande 150-249 n'est pas requise hors année triennale", () => {
		const nonTriennial = INDICATOR_G_TRIENNIAL_BASE_YEAR + 1;
		expect(isIndicatorGRequired(INDICATOR_G_TRIENNIAL_MIN, nonTriennial)).toBe(
			false,
		);
		expect(isIndicatorGRequired(INDICATOR_G_ANNUAL_MIN - 1, nonTriennial)).toBe(
			false,
		);
	});

	it("isTriennialYear : cycle triennal à partir de INDICATOR_G_TRIENNIAL_BASE_YEAR", () => {
		expect(isTriennialYear(INDICATOR_G_TRIENNIAL_BASE_YEAR - 1)).toBe(false);
		expect(isTriennialYear(INDICATOR_G_TRIENNIAL_BASE_YEAR)).toBe(true);
		expect(isTriennialYear(INDICATOR_G_TRIENNIAL_BASE_YEAR + 1)).toBe(false);
		expect(isTriennialYear(INDICATOR_G_TRIENNIAL_BASE_YEAR + 3)).toBe(true);
	});

	it("#3934 (CLOSED) — un effectif < 100 ne déclenche jamais le 7e indicateur", () => {
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

describe("classification d'affichage d'un écart", () => {
	it("gapLevel : frontière positive au seuil (les deux côtés + la valeur pile)", () => {
		expect(gapLevel(GAP_ALERT_THRESHOLD - 1)).toBe("low");
		expect(gapLevel(GAP_ALERT_THRESHOLD)).toBe("high");
		expect(gapLevel(GAP_ALERT_THRESHOLD + 1)).toBe("high");
		expect(gapLevel(null)).toBe(null);
	});

	it("isSignificantGap détecte l'écart significatif dans les deux sens", () => {
		expect(isSignificantGap(GAP_ALERT_THRESHOLD)).toBe(true);
		expect(isSignificantGap(-GAP_ALERT_THRESHOLD)).toBe(true);
		expect(isSignificantGap(GAP_ALERT_THRESHOLD - 1)).toBe(false);
		expect(isSignificantGap(-(GAP_ALERT_THRESHOLD - 1))).toBe(false);
		expect(isSignificantGap(null)).toBe(false);
	});

	it.fails("#3963 — un écart négatif au seuil (défavorable aux hommes) doit être classé « high »", () => {
		// gapLevel is positive-only today: gapLevel(-5) === "low". The business rule
		// is that a gap significant in either direction is « élevé » (take the
		// absolute value). isSignificantGap already honours both directions; gapLevel
		// does not. Fails until #3963 lands.
		expect(gapLevel(-GAP_ALERT_THRESHOLD)).toBe("high");
	});
});

describe("#3946 (côté domaine) — le parcours ne dépend que de l'écart sur l'indicateur G", () => {
	it("un écart G sous le seuil n'exige pas le parcours, quels que soient les écarts A-F", () => {
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

	it("un écart G négatif (défavorable aux hommes) ne déclenche pas le parcours (obligation unidirectionnelle)", () => {
		expect(
			isComplianceProcessRequired({
				workforce: INDICATOR_G_ANNUAL_MIN,
				hasIndicatorG: true,
				gap: -GAP_ALERT_THRESHOLD,
			}),
		).toBe(false);
	});
});
