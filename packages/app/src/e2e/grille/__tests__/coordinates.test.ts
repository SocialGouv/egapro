import { describe, expect, it } from "vitest";

import { isCseRequired, isIndicatorGRequired } from "~/modules/domain";
import {
	buildGrid,
	CAMPAIGN_YEARS,
	type Coordinate,
	pickCoordinate,
	TRANCHES,
} from "../coordinates";

const grid = buildGrid();

const ID_PATTERN = /^\d{4}-(49|99|149|249|250P)-CAS\d{2}$/;

// The case number ranges the grid must project, re-stated from the démarche
// taxonomy: the 12 seven-indicator compliance fiches, the 2 six-indicator ones,
// and the sub-100 tiers with no compliance package (CAS-13 / CAS-14).
function expectedCaseNumbers(
	requiresCompliance: boolean,
	sevenIndicators: boolean,
): number[] {
	if (!requiresCompliance) {
		return sevenIndicators ? [13, 14] : [13];
	}
	return sevenIndicators ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] : [1, 2];
}

function expectedFiche(caseNumber: number, sevenIndicators: boolean): string {
	return `CAS-${String(caseNumber).padStart(2, "0")}${
		sevenIndicators ? "" : "-6IND"
	}`;
}

function countByEffmax(coordinates: Coordinate[]): Record<string, number> {
	return coordinates.reduce<Record<string, number>>((acc, coordinate) => {
		acc[coordinate.effmax] = (acc[coordinate.effmax] ?? 0) + 1;
		return acc;
	}, {});
}

describe("buildGrid — cardinality", () => {
	it("derives exactly 185 coordinates", () => {
		expect(grid).toHaveLength(185);
	});

	// The split is seven-indicator-years × cases-per-cell, sheet by sheet:
	//   49   → 7 years × 2 cases (CAS-13/14 — voluntary tier owes G every year) = 14
	//   99   → 2 years (2030/2033) × 2 + 5 six-indicator years × 1 (CAS-13-6IND) =  9
	//   149  → 2 years (2030/2033) × 12 + 5 years × 2 (CAS-01/02-6IND)           = 34
	//   249  → 3 triennial years (2027/2030/2033) × 12 + 4 years × 2             = 44
	//   250P → 7 years × 12 (indicator G owed every year)                        = 84
	// The literals are expectations only: the counts must keep falling out of
	// isIndicatorGRequired × caseNumbersFor, never be fed into buildGrid().
	it("splits 14 / 9 / 34 / 44 / 84 across the five tranches", () => {
		expect(countByEffmax(grid)).toEqual({
			"49": 14,
			"99": 9,
			"149": 34,
			"249": 44,
			"250P": 84,
		});
	});

	it("covers the seven campaign years with no year hardcoded outside CAMPAIGN_YEARS", () => {
		const years = new Set(grid.map((coordinate) => coordinate.year));
		expect([...years].sort()).toEqual([...CAMPAIGN_YEARS].sort());
	});

	it("spans the 17 distinct fiches of the démarche taxonomy", () => {
		const fiches = new Set(grid.map((coordinate) => coordinate.fiche));
		expect([...fiches].sort()).toEqual(
			[
				"CAS-01",
				"CAS-01-6IND",
				"CAS-02",
				"CAS-02-6IND",
				"CAS-03",
				"CAS-04",
				"CAS-05",
				"CAS-06",
				"CAS-07",
				"CAS-08",
				"CAS-09",
				"CAS-10",
				"CAS-11",
				"CAS-12",
				"CAS-13",
				"CAS-13-6IND",
				"CAS-14",
			].sort(),
		);
	});
});

// S5 — "the grid follows the code, it is not a copy of the test book": every
// coordinate is re-derived from the domain here, so if isIndicatorGRequired or
// isCseRequired changed, the assertions would follow the grid without an edit.
describe("buildGrid — S5 domain coherence", () => {
	it("recomputes each field from the domain for every coordinate", () => {
		for (const coordinate of grid) {
			const requiresCompliance = isCseRequired(coordinate.workforce);
			const sevenIndicators = isIndicatorGRequired(
				coordinate.workforce,
				coordinate.year,
			);

			expect(coordinate.indicatorGRequired).toBe(sevenIndicators);
			expect(
				expectedCaseNumbers(requiresCompliance, sevenIndicators),
			).toContain(coordinate.caseNumber);
			expect(coordinate.fiche).toBe(
				expectedFiche(coordinate.caseNumber, sevenIndicators),
			);

			const expectedHasCse = requiresCompliance
				? coordinate.caseNumber % 2 === 0
				: coordinate.caseNumber === 14
					? true
					: null;
			expect(coordinate.hasCse).toBe(expectedHasCse);
		}
	});

	it("emits every domain-required case number for each (year, tranche) pair", () => {
		for (const year of CAMPAIGN_YEARS) {
			for (const tranche of TRANCHES) {
				const cell = grid.filter(
					(coordinate) =>
						coordinate.year === year && coordinate.effmax === tranche.effmax,
				);
				const expected = expectedCaseNumbers(
					isCseRequired(tranche.workforce),
					isIndicatorGRequired(tranche.workforce, year),
				);
				expect(cell.map((coordinate) => coordinate.caseNumber)).toEqual(
					expected,
				);
				expect(
					cell.every(
						(coordinate) => coordinate.workforce === tranche.workforce,
					),
				).toBe(true);
			}
		}
	});

	it("never marks a sub-100 tranche as CSE-required in a compliance fiche", () => {
		for (const coordinate of grid) {
			if (!isCseRequired(coordinate.workforce)) {
				expect(coordinate.caseNumber).toBeGreaterThanOrEqual(13);
			}
		}
	});
});

describe("buildGrid — coordinate shape", () => {
	it("formats every id as AAAA-EFFMAX-CASNN consistent with its fields", () => {
		for (const coordinate of grid) {
			expect(coordinate.id).toMatch(ID_PATTERN);
			expect(coordinate.id).toBe(
				`${coordinate.year}-${coordinate.effmax}-CAS${String(
					coordinate.caseNumber,
				).padStart(2, "0")}`,
			);
		}
	});

	it("carries a non-empty rappel for every fiche", () => {
		for (const coordinate of grid) {
			expect(coordinate.rappel.length).toBeGreaterThan(0);
		}
	});

	it("keeps ids unique across the grid", () => {
		const ids = grid.map((coordinate) => coordinate.id);
		expect(new Set(ids).size).toBe(ids.length);
	});
});

describe("pickCoordinate", () => {
	it("returns the first coordinate matching a fiche", () => {
		const picked = pickCoordinate(grid, { fiche: "CAS-14" });
		expect(picked.fiche).toBe("CAS-14");
		expect(picked.caseNumber).toBe(14);
	});

	it("narrows by effmax and year when provided", () => {
		const picked = pickCoordinate(grid, {
			fiche: "CAS-12",
			effmax: "250P",
			year: 2027,
		});
		expect(picked).toMatchObject({
			fiche: "CAS-12",
			effmax: "250P",
			year: 2027,
			caseNumber: 12,
		});
	});

	it("throws when no coordinate matches the criteria", () => {
		// CAS-12 is a compliance fiche (>= 100 salariés); effmax 49 is the sub-50
		// tranche — the pairing is impossible in the derived grid.
		expect(() =>
			pickCoordinate(grid, { fiche: "CAS-12", effmax: "49" }),
		).toThrow(/No coordinate matches/);
	});
});
