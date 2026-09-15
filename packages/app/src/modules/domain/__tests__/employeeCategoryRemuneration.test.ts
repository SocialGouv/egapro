import { describe, expect, it } from "vitest";
import {
	isCategoryPayApplicable,
	isSexRemunerationComplete,
	MIN_HEADCOUNT_REQUIRING_PAY_DATA,
	shouldRetainCategoryPayValues,
} from "../shared/employeeCategoryRemuneration";

describe("MIN_HEADCOUNT_REQUIRING_PAY_DATA", () => {
	it("is 1", () => {
		expect(MIN_HEADCOUNT_REQUIRING_PAY_DATA).toBe(1);
	});
});

describe("isSexRemunerationComplete", () => {
	it("is complete when headcount is 0", () => {
		expect(isSexRemunerationComplete(0, [])).toBe(true);
	});

	it("is complete when headcount is undefined", () => {
		expect(isSexRemunerationComplete(undefined, [])).toBe(true);
	});

	it("is complete when headcount is NaN, even with missing pay fields", () => {
		expect(
			isSexRemunerationComplete(Number.NaN, [undefined, "", "18", "1.5"]),
		).toBe(true);
	});

	it("is complete when headcount is at least 1 and every pay field is filled", () => {
		expect(isSexRemunerationComplete(2, ["30000", "2000", "18", "1.5"])).toBe(
			true,
		);
	});

	it("is incomplete when headcount is at least 1 and a pay field is missing", () => {
		expect(
			isSexRemunerationComplete(2, ["30000", undefined, "18", "1.5"]),
		).toBe(false);
	});

	it("is incomplete when headcount is at least 1 and a pay field is an empty string", () => {
		expect(isSexRemunerationComplete(2, ["30000", "", "18", "1.5"])).toBe(
			false,
		);
	});

	it("is complete when headcount is at least 1 but no pay field values are given", () => {
		expect(isSexRemunerationComplete(1, [])).toBe(true);
	});

	it("treats headcount exactly at the threshold as requiring pay data", () => {
		expect(
			isSexRemunerationComplete(MIN_HEADCOUNT_REQUIRING_PAY_DATA, [undefined]),
		).toBe(false);
	});
});

describe("isCategoryPayApplicable (#3678)", () => {
	it("applies when no headcount cell is filled in yet", () => {
		expect(isCategoryPayApplicable({})).toBe(true);
	});

	it("applies when the four headcount cells are at least 1", () => {
		expect(
			isCategoryPayApplicable({
				womenCount: 3,
				menCount: 2,
				hourlyWomenCount: 1,
				hourlyMenCount: 1,
			}),
		).toBe(true);
	});

	it.each([
		[
			"women",
			{ womenCount: 0, menCount: 2, hourlyWomenCount: 0, hourlyMenCount: 2 },
		],
		[
			"men",
			{ womenCount: 2, menCount: 0, hourlyWomenCount: 2, hourlyMenCount: 0 },
		],
		[
			"both sexes",
			{ womenCount: 0, menCount: 0, hourlyWomenCount: 0, hourlyMenCount: 0 },
		],
	] as const)("does not apply when both workforce rows are 0 for %s", (_label, headcounts) => {
		expect(isCategoryPayApplicable(headcounts)).toBe(false);
	});

	it.each([
		["one isolated hourly 0", { hourlyWomenCount: 0 }],
		["two crossed 0s", { womenCount: 0, hourlyMenCount: 0 }],
		["annual 0 and missing hourly count", { womenCount: 0 }],
		[
			"annual 0 and null hourly count",
			{ womenCount: 0, hourlyWomenCount: null },
		],
	])("applies with %s", (_label, headcounts) => {
		expect(isCategoryPayApplicable(headcounts)).toBe(true);
	});

	it("applies when a headcount cell is null — unknown is not zero", () => {
		expect(isCategoryPayApplicable({ womenCount: null })).toBe(true);
	});

	it("applies when a headcount cell is NaN — unparsable is not zero", () => {
		expect(isCategoryPayApplicable({ womenCount: Number.NaN })).toBe(true);
	});
});

describe("shouldRetainCategoryPayValues (#3678)", () => {
	const nonApplicable = {
		womenCount: 0,
		hourlyWomenCount: 0,
		menCount: 2,
		hourlyMenCount: 2,
	};

	it("retains values for an applicable category", () => {
		expect(shouldRetainCategoryPayValues({}, {}, false)).toBe(true);
	});

	it("drops legacy values on an editable surface", () => {
		expect(
			shouldRetainCategoryPayValues(
				nonApplicable,
				{ annualBaseWomen: "40000" },
				false,
			),
		).toBe(false);
	});

	it("retains legacy values on a historical surface", () => {
		expect(
			shouldRetainCategoryPayValues(
				nonApplicable,
				{ annualBaseWomen: "40000" },
				true,
			),
		).toBe(true);
	});

	it("does not treat whitespace-only values as historical pay", () => {
		expect(
			shouldRetainCategoryPayValues(
				nonApplicable,
				{ annualBaseWomen: "   " },
				true,
			),
		).toBe(false);
	});
});
