import { describe, expect, it } from "vitest";
import type {
	PayGapRow,
	QuartileData,
} from "~/modules/declaration-remuneration/types";
import {
	annualQuartileReadingNote,
	beneficiariesReadingNote,
	hourlyQuartileReadingNote,
	payGapReadingNote,
	variablePayGapReadingNote,
} from "../readingNotes";

function rows(womenValue: string, menValue: string): PayGapRow[] {
	return [
		{ label: "Annuelle brute moyenne", womenValue, menValue },
		{ label: "Horaire brute moyenne", womenValue: "", menValue: "" },
		{ label: "Annuelle brute médiane", womenValue: "", menValue: "" },
		{ label: "Horaire brute médiane", womenValue: "", menValue: "" },
	];
}

describe("payGapReadingNote", () => {
	it("mentions men when they are favored", () => {
		expect(payGapReadingNote(rows("95.40", "100"))).toBe(
			"Note de lecture : L'écart de rémunération annuelle brute moyenne est de 4,60 % en faveur des hommes.",
		);
	});

	it("mentions women when they are favored", () => {
		expect(payGapReadingNote(rows("105", "100"))).toBe(
			"Note de lecture : L'écart de rémunération annuelle brute moyenne est de 5,00 % en faveur des femmes.",
		);
	});

	it("omits the sex mention when the gap displays as zero", () => {
		expect(payGapReadingNote(rows("100", "100"))).toBe(
			"Note de lecture : L'écart de rémunération annuelle brute moyenne est de 0,00 %.",
		);
	});

	it("returns null when the annual mean row is missing a value", () => {
		expect(payGapReadingNote(rows("", "100"))).toBeNull();
	});

	it("returns null when an operand is not a number", () => {
		expect(payGapReadingNote(rows(".", "100"))).toBeNull();
		expect(payGapReadingNote(rows("100", "."))).toBeNull();
	});

	it("returns null when the men value is zero (gap undefined)", () => {
		expect(payGapReadingNote(rows("100", "0"))).toBeNull();
	});

	it("returns null when the annual mean row itself is absent", () => {
		const withoutAnnualMean: PayGapRow[] = [
			{ label: "Horaire brute moyenne", womenValue: "10", menValue: "12" },
		];
		expect(payGapReadingNote(withoutAnnualMean)).toBeNull();
	});

	it("uses the GIP-supplied gap while both operands stay untouched", () => {
		const row: PayGapRow[] = [
			{
				label: "Annuelle brute moyenne",
				womenValue: "95.40",
				menValue: "100",
				gipReference: { women: "95.40", men: "100", gap: "0.1234" },
			},
		];
		expect(payGapReadingNote(row)).toBe(
			"Note de lecture : L'écart de rémunération annuelle brute moyenne est de 12,34 % en faveur des hommes.",
		);
	});
});

describe("variablePayGapReadingNote", () => {
	it("names the variable-pay subject", () => {
		expect(variablePayGapReadingNote(rows("99.50", "100"))).toBe(
			"Note de lecture : L'écart de rémunération variable ou complémentaire brute moyenne est de 0,50 % en faveur des hommes.",
		);
	});

	it("returns null when the gap cannot be computed", () => {
		expect(variablePayGapReadingNote(rows("", ""))).toBeNull();
	});
});

describe("beneficiariesReadingNote", () => {
	it("computes the proportion of women beneficiaries", () => {
		expect(beneficiariesReadingNote("60", 120)).toBe(
			"Note de lecture : Parmi les femmes, 50,00 % ont bénéficié de composantes variables ou complémentaires.",
		);
	});

	it("returns null when the beneficiary count is missing", () => {
		expect(beneficiariesReadingNote("", 120)).toBeNull();
	});

	it("returns null when the beneficiary count is not a number", () => {
		expect(beneficiariesReadingNote(".", 120)).toBeNull();
	});

	it("returns null when the workforce reference is missing", () => {
		expect(beneficiariesReadingNote("60", undefined)).toBeNull();
	});

	it("computes a proportion of zero when there are no beneficiaries", () => {
		expect(beneficiariesReadingNote("0", 120)).toBe(
			"Note de lecture : Parmi les femmes, 0,00 % ont bénéficié de composantes variables ou complémentaires.",
		);
	});
});

const firstQuartile = (
	threshold: string | undefined,
	women: number | undefined,
	men: number | undefined,
): QuartileData => ({ threshold, women, men });

describe("annualQuartileReadingNote", () => {
	it("computes both percentages against the annual threshold", () => {
		expect(annualQuartileReadingNote(firstQuartile("20700.35", 60, 30))).toBe(
			"Note de lecture : 66,66 % des femmes du premier quartile ont perçu une rémunération annuelle brute moyenne inférieure à 20 700,35 € contre 33,33 % d'hommes.",
		);
	});

	it("returns null when the threshold is missing", () => {
		expect(
			annualQuartileReadingNote(firstQuartile(undefined, 60, 30)),
		).toBeNull();
	});

	it("returns null when the threshold is an empty string", () => {
		expect(annualQuartileReadingNote(firstQuartile("", 60, 30))).toBeNull();
	});

	it("returns null when the threshold is not a number", () => {
		expect(annualQuartileReadingNote(firstQuartile(".", 60, 30))).toBeNull();
		expect(annualQuartileReadingNote(firstQuartile("-", 60, 30))).toBeNull();
	});

	it("returns null when the quartile headcount is zero", () => {
		expect(
			annualQuartileReadingNote(firstQuartile("20700.35", 0, 0)),
		).toBeNull();
	});

	it("returns null when the first quartile itself is absent", () => {
		expect(annualQuartileReadingNote(undefined)).toBeNull();
	});

	it("treats a missing women count as zero", () => {
		expect(
			annualQuartileReadingNote(firstQuartile("20700.35", undefined, 30)),
		).toBe(
			"Note de lecture : 0,00 % des femmes du premier quartile ont perçu une rémunération annuelle brute moyenne inférieure à 20 700,35 € contre 100,00 % d'hommes.",
		);
	});

	it("treats a missing men count as zero", () => {
		expect(
			annualQuartileReadingNote(firstQuartile("20700.35", 30, undefined)),
		).toBe(
			"Note de lecture : 100,00 % des femmes du premier quartile ont perçu une rémunération annuelle brute moyenne inférieure à 20 700,35 € contre 0,00 % d'hommes.",
		);
	});
});

describe("hourlyQuartileReadingNote", () => {
	it("names the hourly basis", () => {
		expect(hourlyQuartileReadingNote(firstQuartile("13.74", 20, 23))).toBe(
			"Note de lecture : 46,51 % des femmes du premier quartile ont perçu une rémunération horaire brute moyenne inférieure à 13,74 € contre 53,48 % d'hommes.",
		);
	});

	it("returns null when the quartile headcount is zero", () => {
		expect(hourlyQuartileReadingNote(firstQuartile("13.74", 0, 0))).toBeNull();
	});
});
