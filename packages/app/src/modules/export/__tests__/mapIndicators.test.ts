import { describe, expect, it } from "vitest";

import type { CategoryRow, CseOpinionRow } from "../mapIndicators";
import {
	mapCseOpinions,
	mapIndicatorA,
	mapIndicatorB,
	mapIndicatorF,
} from "../mapIndicators";

const makeCategory = (
	step: number,
	name: string,
	women: string | null = null,
	men: string | null = null,
	womenCount: number | null = null,
	menCount: number | null = null,
): CategoryRow => ({
	step,
	categoryName: name,
	womenValue: women,
	menValue: men,
	womenCount,
	menCount,
});

describe("mapIndicatorA", () => {
	it("should map step 2 categories to indicator A fields", () => {
		const categories = [
			makeCategory(2, "Annuelle brute moyenne", "35000", "38000"),
			makeCategory(2, "Horaire brute moyenne", "18.50", "19.20"),
			makeCategory(2, "Annuelle brute médiane", "33500", "36000"),
			makeCategory(2, "Horaire brute médiane", "17.80", "18.50"),
		];

		const result = mapIndicatorA(categories);

		expect(result.indAAnnualMeanWomen).toBe("35000");
		expect(result.indAAnnualMeanMen).toBe("38000");
		expect(result.indAHourlyMeanWomen).toBe("18.50");
		expect(result.indAHourlyMeanMen).toBe("19.20");
		expect(result.indAAnnualMedianWomen).toBe("33500");
		expect(result.indAAnnualMedianMen).toBe("36000");
		expect(result.indAHourlyMedianWomen).toBe("17.80");
		expect(result.indAHourlyMedianMen).toBe("18.50");
	});

	it("should return nulls when categories are empty", () => {
		const result = mapIndicatorA([]);

		expect(result.indAAnnualMeanWomen).toBeNull();
		expect(result.indAAnnualMeanMen).toBeNull();
	});

	it("should ignore step 3 categories", () => {
		const categories = [
			makeCategory(3, "Annuelle brute moyenne", "2500", "3200"),
		];

		const result = mapIndicatorA(categories);

		expect(result.indAAnnualMeanWomen).toBeNull();
	});
});

describe("mapIndicatorB", () => {
	it("should map step 3 categories to indicator B fields", () => {
		const categories = [
			makeCategory(3, "Annuelle brute moyenne", "2500", "3200"),
			makeCategory(3, "Horaire brute moyenne", "1.30", "1.60"),
			makeCategory(3, "Annuelle brute médiane", "2200", "2800"),
			makeCategory(3, "Horaire brute médiane", "1.15", "1.40"),
			makeCategory(3, "Bénéficiaires", "95", "110"),
		];

		const result = mapIndicatorB(categories);

		expect(result.indBAnnualMeanWomen).toBe("2500");
		expect(result.indBBeneficiariesWomen).toBe("95");
		expect(result.indBBeneficiariesMen).toBe("110");
	});

	it("should return nulls when no beneficiaries", () => {
		const result = mapIndicatorB([]);

		expect(result.indBBeneficiariesWomen).toBeNull();
		expect(result.indBBeneficiariesMen).toBeNull();
	});
});

describe("mapIndicatorF", () => {
	it("should map step 4 quartile categories", () => {
		const categories = [
			makeCategory(4, "annual:1er quartile", "22000", null, 35, 28),
			makeCategory(4, "annual:2e quartile", "28500", null, 30, 32),
			makeCategory(4, "annual:3e quartile", "35000", null, 28, 35),
			makeCategory(4, "annual:4e quartile", "48000", null, 27, 35),
			makeCategory(4, "hourly:1er quartile", "11.50", null, 35, 28),
			makeCategory(4, "hourly:2e quartile", "14.80", null, 30, 32),
			makeCategory(4, "hourly:3e quartile", "18.20", null, 28, 35),
			makeCategory(4, "hourly:4e quartile", "24.50", null, 27, 35),
		];

		const result = mapIndicatorF(categories);

		expect(result.indFAnnualQ1Women).toBe(35);
		expect(result.indFAnnualQ1Men).toBe(28);
		expect(result.indFAnnualQ1Threshold).toBe("22000");
		expect(result.indFHourlyQ4Women).toBe(27);
		expect(result.indFHourlyQ4Threshold).toBe("24.50");
	});

	it("should return nulls when empty", () => {
		const result = mapIndicatorF([]);

		expect(result.indFAnnualQ1Women).toBeNull();
		expect(result.indFHourlyQ4Threshold).toBeNull();
	});
});

describe("mapCseOpinions", () => {
	it("should map up to 4 CSE opinions", () => {
		const opinions: CseOpinionRow[] = [
			{ type: "initial", opinion: "favorable", opinionDate: "2026-02-15" },
			{ type: "initial", opinion: "reserved", opinionDate: "2026-03-01" },
		];

		const result = mapCseOpinions(opinions);

		expect(result.cseOpinion1Type).toBe("initial");
		expect(result.cseOpinion1Opinion).toBe("favorable");
		expect(result.cseOpinion1Date).toBe("2026-02-15");
		expect(result.cseOpinion2Type).toBe("initial");
		expect(result.cseOpinion2Opinion).toBe("reserved");
		expect(result.cseOpinion3Type).toBeNull();
		expect(result.cseOpinion4Type).toBeNull();
	});

	it("should return all nulls when empty", () => {
		const result = mapCseOpinions([]);

		expect(result.cseOpinion1Type).toBeNull();
		expect(result.cseOpinion1Opinion).toBeNull();
		expect(result.cseOpinion1Date).toBeNull();
	});
});
