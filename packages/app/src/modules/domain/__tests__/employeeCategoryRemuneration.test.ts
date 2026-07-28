import { describe, expect, it } from "vitest";
import {
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
