import { describe, expect, it } from "vitest";

import { TOTAL_STEPS } from "~/modules/declaration-remuneration";
import {
	getFunnelSteps,
	getNextStepHref,
	getPreviousStepHref,
	INDICATOR_G_STEP,
	stepHref,
} from "../funnelSteps";

describe("stepHref", () => {
	it("builds the funnel step URL", () => {
		expect(stepHref(1)).toBe("/declaration-remuneration/etape/1");
		expect(stepHref(INDICATOR_G_STEP)).toBe(
			"/declaration-remuneration/etape/5",
		);
	});
});

describe("getFunnelSteps", () => {
	it("keeps every step when indicator G is required", () => {
		expect(getFunnelSteps(true)).toEqual([1, 2, 3, 4, 5, 6]);
		expect(getFunnelSteps(true)).toHaveLength(TOTAL_STEPS);
	});

	it("drops the indicator G step when it is not required", () => {
		expect(getFunnelSteps(false)).toEqual([1, 2, 3, 4, 6]);
		expect(getFunnelSteps(false)).not.toContain(INDICATOR_G_STEP);
	});
});

describe("getNextStepHref", () => {
	it("walks the full funnel when indicator G is required", () => {
		expect(getNextStepHref(1, true)).toBe("/declaration-remuneration/etape/2");
		expect(getNextStepHref(4, true)).toBe("/declaration-remuneration/etape/5");
		expect(getNextStepHref(5, true)).toBe("/declaration-remuneration/etape/6");
	});

	it("skips from step 4 to step 6 when indicator G is not required", () => {
		expect(getNextStepHref(4, false)).toBe("/declaration-remuneration/etape/6");
	});

	it("returns undefined on the last step", () => {
		expect(getNextStepHref(6, true)).toBeUndefined();
		expect(getNextStepHref(6, false)).toBeUndefined();
	});
});

describe("getPreviousStepHref", () => {
	it("walks the full funnel backwards when indicator G is required", () => {
		expect(getPreviousStepHref(6, true)).toBe(
			"/declaration-remuneration/etape/5",
		);
		expect(getPreviousStepHref(2, true)).toBe(
			"/declaration-remuneration/etape/1",
		);
	});

	it("goes back from step 6 to step 4 when indicator G is not required", () => {
		expect(getPreviousStepHref(6, false)).toBe(
			"/declaration-remuneration/etape/4",
		);
	});

	it("returns undefined on the first step", () => {
		expect(getPreviousStepHref(1, true)).toBeUndefined();
		expect(getPreviousStepHref(1, false)).toBeUndefined();
	});

	it("returns undefined for a step that is not part of the funnel", () => {
		expect(getPreviousStepHref(5, false)).toBeUndefined();
		expect(getPreviousStepHref(99, true)).toBeUndefined();
	});
});
