import { describe, expect, it } from "vitest";
import { migrateLegacyThresholds } from "~/modules/domain";

describe("step4Data loader migration", () => {
	it("builds tuple with [3].threshold === undefined from 3 DB thresholds", () => {
		const annualThresholds = migrateLegacyThresholds([
			"25000",
			"35000",
			"50000",
		]);
		const step4Annual = [
			{ threshold: annualThresholds[0], women: 10, men: 12 },
			{ threshold: annualThresholds[1], women: 8, men: 9 },
			{ threshold: annualThresholds[2], women: 5, men: 6 },
			{ threshold: undefined, women: 3, men: 4 },
		];
		expect(step4Annual[3]?.threshold).toBeUndefined();
		expect(step4Annual[0]?.threshold).toBe("25000");
		expect(step4Annual[1]?.threshold).toBe("35000");
		expect(step4Annual[2]?.threshold).toBe("50000");
	});

	it("normalizes null DB thresholds to empty string for Q1-Q3", () => {
		const thresholds = migrateLegacyThresholds([null, null, null]);
		expect(thresholds).toEqual(["", "", ""]);
	});
});
