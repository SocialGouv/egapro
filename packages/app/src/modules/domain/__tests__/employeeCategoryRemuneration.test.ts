import { describe, expect, it } from "vitest";
import {
	isCategoryPayApplicable,
	isSexRemunerationComplete,
	MIN_HEADCOUNT_REQUIRING_PAY_DATA,
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
		["womenCount", { womenCount: 0 }],
		["menCount", { menCount: 0 }],
		["hourlyWomenCount", { hourlyWomenCount: 0 }],
		["hourlyMenCount", { hourlyMenCount: 0 }],
	])("does not apply when %s is an explicit 0", (_field, headcounts) => {
		expect(isCategoryPayApplicable(headcounts)).toBe(false);
	});

	it("does not apply when a 0 faces a headcount on the same basis", () => {
		expect(isCategoryPayApplicable({ womenCount: 3, menCount: 0 })).toBe(false);
	});

	it("does not apply when the 0 is on the other basis than the headcount", () => {
		expect(isCategoryPayApplicable({ womenCount: 3, hourlyMenCount: 0 })).toBe(
			false,
		);
	});

	it("applies when a headcount cell is null — unknown is not zero", () => {
		expect(isCategoryPayApplicable({ womenCount: null })).toBe(true);
	});

	it("applies when a headcount cell is NaN — unparsable is not zero", () => {
		expect(isCategoryPayApplicable({ womenCount: Number.NaN })).toBe(true);
	});
});
