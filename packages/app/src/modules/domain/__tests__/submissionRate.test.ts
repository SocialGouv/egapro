import { describe, expect, it } from "vitest";

import {
	buildCampaignRateTileProps,
	computeRate,
	roundOneDecimal,
} from "../shared/submissionRate";

describe("roundOneDecimal", () => {
	it("rounds to one decimal place (banker-agnostic)", () => {
		expect(roundOneDecimal(73.42)).toBe(73.4);
		expect(roundOneDecimal(73.45)).toBe(73.5);
		expect(roundOneDecimal(73.44)).toBe(73.4);
		expect(roundOneDecimal(73.0)).toBe(73);
	});

	it("handles negatives", () => {
		expect(roundOneDecimal(-2.07)).toBe(-2.1);
		expect(roundOneDecimal(-0.04)).toBeCloseTo(0, 10);
	});
});

describe("computeRate", () => {
	it("returns 0 when obligated = 0 (no division by zero)", () => {
		expect(computeRate(0, 0)).toBe(0);
		expect(computeRate(5, 0)).toBe(0);
	});

	it("returns a percentage rounded to one decimal", () => {
		expect(computeRate(73, 100)).toBe(73);
		expect(computeRate(1, 3)).toBe(33.3);
		expect(computeRate(2, 3)).toBe(66.7);
		expect(computeRate(1, 2)).toBe(50);
	});

	it("computes 100 when submitted === obligated", () => {
		expect(computeRate(42, 42)).toBe(100);
	});
});

describe("buildCampaignRateTileProps", () => {
	const data = {
		totalIndicatorsSubmitted: 4800,
		totalDemarcheCompleted: 4213,
		totalObligated: 5738,
		completionRate: 73.4,
		previousYearRate: 71.3,
	};

	it("glues the percent sign to the rate with a narrow no-break space", () => {
		expect(buildCampaignRateTileProps(data, 2026, 2025).value).toBe(
			"73,4\u202f%",
		);
	});

	it("names the campaign year and shows both counts over the same population", () => {
		const props = buildCampaignRateTileProps(data, 2026, 2025);

		expect(props.title).toBe("Taux de déclaration 2026");
		expect(props.subtitle).toEqual([
			"4\u202f800 / 5\u202f738 ont transmis leurs indicateurs",
			"4\u202f213 / 5\u202f738 ont terminé leur démarche",
		]);
	});

	it("derives the rate and the delta from completed procedures, not from submitted indicators", () => {
		const props = buildCampaignRateTileProps(
			{
				totalIndicatorsSubmitted: 24,
				totalDemarcheCompleted: 20,
				totalObligated: 200,
				completionRate: 10,
				previousYearRate: 15,
			},
			2026,
			2025,
		);

		expect(props.value).toBe("10,0\u202f%");
		expect(props.delta).toEqual({ points: -5, comparisonLabel: "vs 2025" });
	});

	it("measures the delta against the comparison year", () => {
		expect(buildCampaignRateTileProps(data, 2026, 2025).delta).toEqual({
			points: 2.1,
			comparisonLabel: "vs 2025",
		});
	});

	it("shows no delta when there is no previous year to compare with", () => {
		expect(
			buildCampaignRateTileProps(
				{ ...data, previousYearRate: null },
				2026,
				2025,
			).delta,
		).toBeNull();
	});

	it("writes a whole rate with its decimal, never bare", () => {
		expect(
			buildCampaignRateTileProps(
				{
					totalIndicatorsSubmitted: 0,
					totalDemarcheCompleted: 0,
					totalObligated: 0,
					completionRate: 0,
					previousYearRate: null,
				},
				2026,
				2025,
			).value,
		).toBe("0,0\u202f%");
	});
});
