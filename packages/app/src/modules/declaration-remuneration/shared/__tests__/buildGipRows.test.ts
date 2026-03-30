import { describe, expect, it } from "vitest";
import { buildGipRows } from "../buildGipRows";

describe("buildGipRows", () => {
	it("builds 4 rows from complete step data", () => {
		const rows = buildGipRows({
			annualMeanWomen: "35000.00",
			annualMeanMen: "38000.00",
			hourlyMeanWomen: "18.50",
			hourlyMeanMen: "20.00",
			annualMedianWomen: "33000.00",
			annualMedianMen: "36000.00",
			hourlyMedianWomen: "17.50",
			hourlyMedianMen: "19.00",
		});

		expect(rows).toHaveLength(4);
		expect(rows[0]).toEqual({
			label: "Annuelle brute moyenne",
			womenValue: "35000.00",
			menValue: "38000.00",
		});
		expect(rows[1]).toEqual({
			label: "Horaire brute moyenne",
			womenValue: "18.50",
			menValue: "20.00",
		});
		expect(rows[2]).toEqual({
			label: "Annuelle brute médiane",
			womenValue: "33000.00",
			menValue: "36000.00",
		});
		expect(rows[3]).toEqual({
			label: "Horaire brute médiane",
			womenValue: "17.50",
			menValue: "19.00",
		});
	});

	it("converts null values to empty strings", () => {
		const rows = buildGipRows({
			annualMeanWomen: null,
			annualMeanMen: null,
			hourlyMeanWomen: null,
			hourlyMeanMen: null,
			annualMedianWomen: null,
			annualMedianMen: null,
			hourlyMedianWomen: null,
			hourlyMedianMen: null,
		});

		for (const row of rows) {
			expect(row.womenValue).toBe("");
			expect(row.menValue).toBe("");
		}
	});

	it("converts undefined values to empty strings", () => {
		const rows = buildGipRows({});

		for (const row of rows) {
			expect(row.womenValue).toBe("");
			expect(row.menValue).toBe("");
		}
	});

	it("handles mixed null and filled values (partial indicators)", () => {
		const rows = buildGipRows({
			annualMeanWomen: "35000.00",
			annualMeanMen: "38000.00",
			hourlyMeanWomen: null,
			hourlyMeanMen: null,
			annualMedianWomen: null,
			annualMedianMen: null,
			hourlyMedianWomen: null,
			hourlyMedianMen: null,
		});

		expect(rows[0]?.womenValue).toBe("35000.00");
		expect(rows[0]?.menValue).toBe("38000.00");
		expect(rows[1]?.womenValue).toBe("");
		expect(rows[1]?.menValue).toBe("");
	});

	it("handles women-only data (men values null)", () => {
		const rows = buildGipRows({
			annualMeanWomen: "900.00",
			annualMeanMen: null,
			hourlyMeanWomen: "0.49",
			hourlyMeanMen: null,
		});

		expect(rows[0]?.womenValue).toBe("900.00");
		expect(rows[0]?.menValue).toBe("");
		expect(rows[1]?.womenValue).toBe("0.49");
		expect(rows[1]?.menValue).toBe("");
	});
});
