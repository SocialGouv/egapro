import { describe, expect, it } from "vitest";
import {
	COMPANY_SIZE_ANNUAL_MIN,
	COMPANY_SIZE_VOLUNTARY_MAX,
	getNextStepsBlocks,
	isIndicatorGRequiredForGip,
} from "~/modules/domain";

describe("getNextStepsBlocks", () => {
	it("shows only the afterward block under 50 employees, regardless of indicator G or gap", () => {
		expect(
			getNextStepsBlocks({
				workforce: COMPANY_SIZE_VOLUNTARY_MAX - 1,
				indicatorGRequired: true,
				hasSignificantIndicatorGGap: true,
			}),
		).toEqual(["afterward"]);
	});

	it("treats a company absent from the GIP file (null workforce) as the voluntary tier", () => {
		expect(
			getNextStepsBlocks({
				workforce: null,
				indicatorGRequired: true,
				hasSignificantIndicatorGGap: true,
			}),
		).toEqual(["afterward"]);
	});

	it("shows the CSE-inform + afterward blocks for 50-99 without indicator G", () => {
		expect(
			getNextStepsBlocks({
				workforce: COMPANY_SIZE_VOLUNTARY_MAX,
				indicatorGRequired: false,
				hasSignificantIndicatorGGap: false,
			}),
		).toEqual(["cse-inform", "afterward"]);
	});

	it("shows the CSE-inform + gap-remediation blocks for 50-99 with indicator G and a significant gap", () => {
		expect(
			getNextStepsBlocks({
				workforce: COMPANY_SIZE_ANNUAL_MIN - 1,
				indicatorGRequired: true,
				hasSignificantIndicatorGGap: true,
			}),
		).toEqual(["cse-inform", "gap-remediation"]);
	});

	// No dedicated Figma frame for this combination — falls back to the 6-indicator blocks.
	it("falls back to CSE-inform + afterward for 50-99 with indicator G but no significant gap", () => {
		expect(
			getNextStepsBlocks({
				workforce: COMPANY_SIZE_VOLUNTARY_MAX,
				indicatorGRequired: true,
				hasSignificantIndicatorGGap: false,
			}),
		).toEqual(["cse-inform", "afterward"]);
	});

	it("shows only the CSE-inform-and-consult block for >=100 without indicator G", () => {
		expect(
			getNextStepsBlocks({
				workforce: COMPANY_SIZE_ANNUAL_MIN,
				indicatorGRequired: false,
				hasSignificantIndicatorGGap: false,
			}),
		).toEqual(["cse-inform-and-consult"]);
	});

	it("shows only the CSE-inform-and-consult block for >=100 with indicator G but no significant gap", () => {
		expect(
			getNextStepsBlocks({
				workforce: COMPANY_SIZE_ANNUAL_MIN,
				indicatorGRequired: true,
				hasSignificantIndicatorGGap: false,
			}),
		).toEqual(["cse-inform-and-consult"]);
	});

	it("shows the CSE-inform-and-consult + gap-compliance-process blocks for >=100 with a significant gap", () => {
		expect(
			getNextStepsBlocks({
				workforce: COMPANY_SIZE_ANNUAL_MIN,
				indicatorGRequired: true,
				hasSignificantIndicatorGGap: true,
			}),
		).toEqual(["cse-inform-and-consult", "gap-compliance-process"]);
	});

	it("ignores hasSignificantIndicatorGGap when indicator G does not apply this year", () => {
		expect(
			getNextStepsBlocks({
				workforce: 300,
				indicatorGRequired: false,
				hasSignificantIndicatorGGap: true,
			}),
		).toEqual(["cse-inform-and-consult"]);
	});

	describe("composed with isIndicatorGRequiredForGip across campaign years", () => {
		const YEARS = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033];

		const TIERS = [
			{ label: "<50", workforce: 30 },
			{ label: "50-99", workforce: 60 },
			{ label: "100-249", workforce: 150 },
			{ label: "250+", workforce: 300 },
		] as const;

		it.each(
			TIERS,
		)("$label tier: a significant gap only ever surfaces a gap block when indicator G applies that year", ({
			workforce,
		}) => {
			for (const year of YEARS) {
				const indicatorGRequired = isIndicatorGRequiredForGip(workforce, year);
				const blocks = getNextStepsBlocks({
					workforce,
					indicatorGRequired,
					hasSignificantIndicatorGGap: true,
				});

				const hasGapBlock = blocks.some((block) => block.startsWith("gap-"));
				expect(hasGapBlock).toBe(indicatorGRequired && workforce >= 50);
			}
		});

		it("<50 always shows only the afterward block, every year, indicator G or not", () => {
			for (const year of YEARS) {
				const indicatorGRequired = isIndicatorGRequiredForGip(30, year);
				expect(indicatorGRequired).toBe(true); // voluntary tier always carries G
				expect(
					getNextStepsBlocks({
						workforce: 30,
						indicatorGRequired,
						hasSignificantIndicatorGGap: false,
					}),
				).toEqual(["afterward"]);
			}
		});
	});
});
