import { describe, expect, it } from "vitest";

import { getScoreBracket, SCORE_BRACKETS } from "../shared/scoreBracket";

describe("SCORE_BRACKETS", () => {
	it("declares the 8 brackets in canonical order with NC last", () => {
		expect(SCORE_BRACKETS.map((b) => b.id)).toEqual([
			"lt50",
			"50-59",
			"60-69",
			"70-79",
			"80-89",
			"90-99",
			"100",
			"nc",
		]);
	});

	it("exposes human-readable labels for each bracket", () => {
		expect(SCORE_BRACKETS.map((b) => b.label)).toEqual([
			"<50",
			"50-59",
			"60-69",
			"70-79",
			"80-89",
			"90-99",
			"100",
			"NC",
		]);
	});

	it("uses null min/max for the NC bracket", () => {
		const nc = SCORE_BRACKETS.find((b) => b.id === "nc");
		expect(nc?.min).toBeNull();
		expect(nc?.max).toBeNull();
	});
});

describe("getScoreBracket", () => {
	it("returns 'nc' when score is null", () => {
		expect(getScoreBracket(null)).toBe("nc");
	});

	it("returns 'nc' when score is NaN", () => {
		expect(getScoreBracket(Number.NaN)).toBe("nc");
	});

	it("returns 'nc' when score is Infinity", () => {
		expect(getScoreBracket(Number.POSITIVE_INFINITY)).toBe("nc");
	});

	it("returns 'lt50' for scores below 50 (including 0 and 49)", () => {
		expect(getScoreBracket(0)).toBe("lt50");
		expect(getScoreBracket(25)).toBe("lt50");
		expect(getScoreBracket(49)).toBe("lt50");
	});

	it("returns '50-59' for scores in [50, 59]", () => {
		expect(getScoreBracket(50)).toBe("50-59");
		expect(getScoreBracket(55)).toBe("50-59");
		expect(getScoreBracket(59)).toBe("50-59");
	});

	it("returns '60-69' for scores in [60, 69]", () => {
		expect(getScoreBracket(60)).toBe("60-69");
		expect(getScoreBracket(69)).toBe("60-69");
	});

	it("returns '70-79' for scores in [70, 79]", () => {
		expect(getScoreBracket(70)).toBe("70-79");
		expect(getScoreBracket(79)).toBe("70-79");
	});

	it("returns '80-89' for scores in [80, 89]", () => {
		expect(getScoreBracket(80)).toBe("80-89");
		expect(getScoreBracket(89)).toBe("80-89");
	});

	it("returns '90-99' for scores in [90, 99]", () => {
		expect(getScoreBracket(90)).toBe("90-99");
		expect(getScoreBracket(99)).toBe("90-99");
	});

	it("returns '100' for the perfect score", () => {
		expect(getScoreBracket(100)).toBe("100");
	});

	it("returns '100' for scores above 100 (defensive)", () => {
		expect(getScoreBracket(105)).toBe("100");
	});
});
