import { describe, expect, it } from "vitest";
import { GAP_ALERT_THRESHOLD } from "~/modules/domain";
import { computeGapHighFlags } from "../gapHighFlags";

function category(
	declarationType: "initial" | "correction",
	annualBaseWomen: string,
	annualBaseMen: string,
) {
	return { declarationType, annualBaseWomen, annualBaseMen };
}

const aboveThresholdWomen = String(100 - GAP_ALERT_THRESHOLD - 1);
const belowThresholdWomen = String(100 - GAP_ALERT_THRESHOLD + 1);

describe("computeGapHighFlags", () => {
	it("returns both flags false when there are no categories", () => {
		expect(computeGapHighFlags([])).toEqual({
			firstDeclGapHigh: false,
			secondDeclGapHigh: false,
		});
	});

	it("flags only the first declaration when the initial gap is ≥ the alert threshold", () => {
		expect(
			computeGapHighFlags([
				category("initial", aboveThresholdWomen, "100"),
				category("correction", belowThresholdWomen, "100"),
			]),
		).toEqual({
			firstDeclGapHigh: true,
			secondDeclGapHigh: false,
		});
	});

	it("flags only the second declaration when the correction gap is ≥ the alert threshold", () => {
		expect(
			computeGapHighFlags([
				category("initial", belowThresholdWomen, "100"),
				category("correction", aboveThresholdWomen, "100"),
			]),
		).toEqual({
			firstDeclGapHigh: false,
			secondDeclGapHigh: true,
		});
	});

	it("flags both declarations when each side has a gap ≥ the alert threshold", () => {
		expect(
			computeGapHighFlags([
				category("initial", aboveThresholdWomen, "100"),
				category("correction", aboveThresholdWomen, "100"),
			]),
		).toEqual({
			firstDeclGapHigh: true,
			secondDeclGapHigh: true,
		});
	});

	it("treats a gap sitting on the alert threshold as high", () => {
		const atThresholdWomen = String(100 - GAP_ALERT_THRESHOLD);
		expect(
			computeGapHighFlags([category("correction", atThresholdWomen, "100")]),
		).toEqual({
			firstDeclGapHigh: false,
			secondDeclGapHigh: true,
		});
	});
});
