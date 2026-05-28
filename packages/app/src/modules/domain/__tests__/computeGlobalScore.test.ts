import { describe, expect, it } from "vitest";

import { computeGlobalScore } from "../shared/computeGlobalScore";

describe("computeGlobalScore", () => {
	it("sums the three sub-scores when all are present", () => {
		expect(
			computeGlobalScore({
				remunerationScore: 40,
				quartileScore: 15,
				categoryScore: 30,
			}),
		).toBe(85);
	});

	it("returns the maximum 100 when all sub-scores are at their max", () => {
		expect(
			computeGlobalScore({
				remunerationScore: 40,
				quartileScore: 15,
				categoryScore: 45,
			}),
		).toBe(100);
	});

	it("returns 0 when all sub-scores are 0", () => {
		expect(
			computeGlobalScore({
				remunerationScore: 0,
				quartileScore: 0,
				categoryScore: 0,
			}),
		).toBe(0);
	});

	it("returns null when remunerationScore is missing", () => {
		expect(
			computeGlobalScore({
				remunerationScore: null,
				quartileScore: 15,
				categoryScore: 30,
			}),
		).toBeNull();
	});

	it("returns null when quartileScore is missing", () => {
		expect(
			computeGlobalScore({
				remunerationScore: 40,
				quartileScore: null,
				categoryScore: 30,
			}),
		).toBeNull();
	});

	it("returns null when categoryScore is missing", () => {
		expect(
			computeGlobalScore({
				remunerationScore: 40,
				quartileScore: 15,
				categoryScore: null,
			}),
		).toBeNull();
	});

	it("returns null when all sub-scores are missing", () => {
		expect(
			computeGlobalScore({
				remunerationScore: null,
				quartileScore: null,
				categoryScore: null,
			}),
		).toBeNull();
	});
});
