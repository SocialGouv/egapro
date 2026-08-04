import { describe, expect, it } from "vitest";

import type {
	Step2Data,
	Step3Data,
} from "~/modules/declaration-remuneration/types";
import { nullGipStep2, nullGipStep3 } from "~/test/gipGapFixtures";
import {
	getStep2FieldName,
	getStep3FieldName,
	gipPayGapReferences,
	step2ToRows,
	step3ToRows,
} from "../indicatorRowMapping";

const PAY_GAP_LABELS = [
	"Annuelle brute moyenne",
	"Horaire brute moyenne",
	"Annuelle brute médiane",
	"Horaire brute médiane",
];

// Distinct values per field so a mis-ordered row surfaces as a mismatch rather
// than matching a look-alike neighbour.
const step2Data: Step2Data = {
	indicatorAAnnualWomen: "1000",
	indicatorAAnnualMen: "1001",
	indicatorAHourlyWomen: "1002",
	indicatorAHourlyMen: "1003",
	indicatorCAnnualWomen: "1004",
	indicatorCAnnualMen: "1005",
	indicatorCHourlyWomen: "1006",
	indicatorCHourlyMen: "1007",
};

const step3Data: Step3Data = {
	indicatorBAnnualWomen: "2000",
	indicatorBAnnualMen: "2001",
	indicatorBHourlyWomen: "2002",
	indicatorBHourlyMen: "2003",
	indicatorDAnnualWomen: "2004",
	indicatorDAnnualMen: "2005",
	indicatorDHourlyWomen: "2006",
	indicatorDHourlyMen: "2007",
	indicatorEWomen: "30",
	indicatorEMen: "40",
};

describe("gipPayGapReferences", () => {
	it("projects a step2 block onto the 4 rows in label order", () => {
		const references = gipPayGapReferences({
			...nullGipStep2(),
			annualMeanWomen: "10",
			annualMeanMen: "11",
			annualMeanGap: "0.0001",
			hourlyMeanWomen: "12",
			hourlyMeanMen: "13",
			hourlyMeanGap: "0.0002",
			annualMedianWomen: "14",
			annualMedianMen: "15",
			annualMedianGap: "0.0003",
			hourlyMedianWomen: "16",
			hourlyMedianMen: "17",
			hourlyMedianGap: "0.0004",
		});

		expect(references).toEqual([
			{ women: "10", men: "11", gap: "0.0001" },
			{ women: "12", men: "13", gap: "0.0002" },
			{ women: "14", men: "15", gap: "0.0003" },
			{ women: "16", men: "17", gap: "0.0004" },
		]);
	});

	it("projects a step3 block, ignoring the beneficiary counts", () => {
		const references = gipPayGapReferences({
			...nullGipStep3(),
			annualMeanWomen: "20",
			annualMeanMen: "21",
			annualMeanGap: "0.0005",
			beneficiaryCountWomen: 45,
			beneficiaryCountMen: 60,
		});

		expect(references[0]).toEqual({
			women: "20",
			men: "21",
			gap: "0.0005",
		});
		expect(references[3]).toEqual({ women: null, men: null, gap: null });
	});

	it("returns 4 empty references when there is no GIP block", () => {
		for (const empty of [null, undefined]) {
			const references = gipPayGapReferences(empty);
			expect(references).toHaveLength(4);
			expect(references).toEqual([undefined, undefined, undefined, undefined]);
		}
	});
});

describe("step2ToRows", () => {
	it("builds the 4 labelled rows from the indicator A/C operands", () => {
		expect(step2ToRows(step2Data)).toEqual([
			{
				label: "Annuelle brute moyenne",
				womenValue: "1000",
				menValue: "1001",
				gipReference: undefined,
			},
			{
				label: "Horaire brute moyenne",
				womenValue: "1002",
				menValue: "1003",
				gipReference: undefined,
			},
			{
				label: "Annuelle brute médiane",
				womenValue: "1004",
				menValue: "1005",
				gipReference: undefined,
			},
			{
				label: "Horaire brute médiane",
				womenValue: "1006",
				menValue: "1007",
				gipReference: undefined,
			},
		]);
	});

	it("attaches each reference to the row of the same rank", () => {
		const references = gipPayGapReferences({
			...nullGipStep2(),
			annualMedianWomen: "1004",
			annualMedianMen: "1005",
			annualMedianGap: "0.0003",
		});

		const rows = step2ToRows(step2Data, references);

		expect(rows[2]?.label).toBe("Annuelle brute médiane");
		expect(rows[2]?.gipReference).toEqual({
			women: "1004",
			men: "1005",
			gap: "0.0003",
		});
	});

	it("leaves every row without a reference when none is passed", () => {
		for (const row of step2ToRows(step2Data)) {
			expect(row.gipReference).toBeUndefined();
		}
	});
});

describe("step3ToRows", () => {
	it("builds the 4 labelled rows from the indicator B/D operands", () => {
		const rows = step3ToRows(step3Data);

		expect(rows.map((r) => r.label)).toEqual(PAY_GAP_LABELS);
		expect(rows.map((r) => r.womenValue)).toEqual([
			"2000",
			"2002",
			"2004",
			"2006",
		]);
		expect(rows.map((r) => r.menValue)).toEqual([
			"2001",
			"2003",
			"2005",
			"2007",
		]);
	});

	it("attaches each reference to the row of the same rank", () => {
		const references = gipPayGapReferences({
			...nullGipStep3(),
			hourlyMedianWomen: "2006",
			hourlyMedianMen: "2007",
			hourlyMedianGap: "0.0008",
		});

		const rows = step3ToRows(step3Data, references);

		expect(rows[3]?.label).toBe("Horaire brute médiane");
		expect(rows[3]?.gipReference).toEqual({
			women: "2006",
			men: "2007",
			gap: "0.0008",
		});
	});
});

describe("getStep2FieldName", () => {
	it("resolves the women and men field of a valid row", () => {
		expect(getStep2FieldName(0, "womenValue")).toBe("indicatorAAnnualWomen");
		expect(getStep2FieldName(3, "menValue")).toBe("indicatorCHourlyMen");
	});

	it("throws on a row index outside the 4 pay-gap rows", () => {
		expect(() => getStep2FieldName(4, "womenValue")).toThrow(
			"Invalid step2 row index: 4",
		);
	});
});

describe("getStep3FieldName", () => {
	it("resolves the women and men field of a valid row", () => {
		expect(getStep3FieldName(0, "womenValue")).toBe("indicatorBAnnualWomen");
		expect(getStep3FieldName(3, "menValue")).toBe("indicatorDHourlyMen");
	});

	it("throws on a row index outside the 4 pay-gap rows", () => {
		expect(() => getStep3FieldName(4, "menValue")).toThrow(
			"Invalid step3 row index: 4",
		);
	});
});
