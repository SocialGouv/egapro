import { describe, expect, it } from "vitest";
import { clampStep, lastStep, toStep } from "../shared/stepDomain";

const STEPS = [1, 2, 3] as const;

describe("toStep", () => {
	it("accepts a number the funnel has a page for", () => {
		expect(toStep(STEPS, 1)).toBe(1);
		expect(toStep(STEPS, 3)).toBe(3);
	});

	it("rejects anything outside the funnel", () => {
		expect(toStep(STEPS, 0)).toBeNull();
		expect(toStep(STEPS, 4)).toBeNull();
		expect(toStep(STEPS, -1)).toBeNull();
	});

	it("rejects non-integers, which no URL segment can name", () => {
		expect(toStep(STEPS, 1.5)).toBeNull();
		expect(toStep(STEPS, Number.NaN)).toBeNull();
	});
});

describe("lastStep", () => {
	it("returns the final step of the funnel", () => {
		expect(lastStep(STEPS)).toBe(3);
	});

	it("returns the only step of a one-step funnel", () => {
		expect(lastStep([7] as const)).toBe(7);
	});
});

describe("clampStep", () => {
	it("leaves a step inside the funnel untouched", () => {
		expect(clampStep(STEPS, 2)).toBe(2);
	});

	it("pulls a cursor below the funnel up to the first step", () => {
		expect(clampStep(STEPS, 0)).toBe(1);
		expect(clampStep(STEPS, -3)).toBe(1);
	});

	it("pulls a cursor past the funnel down to the last step", () => {
		expect(clampStep(STEPS, 4)).toBe(3);
		expect(clampStep(STEPS, 99)).toBe(3);
	});

	it("falls back to the first step for a value inside the range but off the grid", () => {
		expect(clampStep(STEPS, 2.5)).toBe(1);
	});
});
