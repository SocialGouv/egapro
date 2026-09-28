import { describe, expect, it } from "vitest";

import {
	computeWorkforceTotal,
	sumCategoryWorkforce,
	sumQuartileWorkforce,
} from "../shared/workforce";

describe("sumQuartileWorkforce", () => {
	it("sums women and men across quartiles and computes total", () => {
		expect(
			sumQuartileWorkforce([
				{ women: 2, men: 3 },
				{ women: null, men: 1 },
			]),
		).toEqual({ women: 2, men: 4, total: 6 });
	});

	it("treats missing women/men fields as zero", () => {
		expect(sumQuartileWorkforce([{}, { women: 5 }, { men: 7 }])).toEqual({
			women: 5,
			men: 7,
			total: 12,
		});
	});

	it("returns zeros for an empty quartile list", () => {
		expect(sumQuartileWorkforce([])).toEqual({ women: 0, men: 0, total: 0 });
	});
});

describe("sumCategoryWorkforce", () => {
	it("sums parsed women and men counts per pay basis across categories", () => {
		expect(
			sumCategoryWorkforce([
				{
					womenCount: "2",
					menCount: "3",
					hourlyWomenCount: "1",
					hourlyMenCount: "5",
				},
				{
					womenCount: "4",
					menCount: "1",
					hourlyWomenCount: "2",
					hourlyMenCount: "2",
				},
			]),
		).toEqual({
			annual: { women: 6, men: 4 },
			hourly: { women: 3, men: 7 },
		});
	});

	it("keeps the two bases independent", () => {
		expect(sumCategoryWorkforce([{ womenCount: "8", menCount: "9" }])).toEqual({
			annual: { women: 8, men: 9 },
			hourly: { women: 0, men: 0 },
		});
	});

	it("treats empty and non-numeric counts as zero", () => {
		expect(
			sumCategoryWorkforce([
				{
					womenCount: "",
					menCount: "abc",
					hourlyWomenCount: "",
					hourlyMenCount: "x",
				},
				{ womenCount: null, menCount: undefined },
				{},
			]),
		).toEqual({
			annual: { women: 0, men: 0 },
			hourly: { women: 0, men: 0 },
		});
	});

	it("returns zeros for an empty category list", () => {
		expect(sumCategoryWorkforce([])).toEqual({
			annual: { women: 0, men: 0 },
			hourly: { women: 0, men: 0 },
		});
	});
});

describe("computeWorkforceTotal", () => {
	it("adds women and men", () => {
		expect(computeWorkforceTotal(12, 8)).toBe(20);
	});

	it("returns zero when both are zero", () => {
		expect(computeWorkforceTotal(0, 0)).toBe(0);
	});
});
