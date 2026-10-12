import { describe, expect, it } from "vitest";

import {
	DISPLAY_DECIMALS,
	RATIO_DECIMALS,
	truncateDecimals,
	truncateRatio,
} from "../shared/decimal";

describe("DISPLAY_DECIMALS", () => {
	it("shows two decimals to the user", () => {
		expect(DISPLAY_DECIMALS).toBe(2);
	});
});

describe("truncateDecimals", () => {
	it("truncates to two decimals by default, never rounding up", () => {
		expect(truncateDecimals(49.876)).toBe(49.87);
		expect(truncateDecimals(51.428571)).toBe(51.42);
		expect(truncateDecimals(66.666)).toBe(66.66);
	});

	it("keeps a value that already has fewer decimals", () => {
		expect(truncateDecimals(40)).toBe(40);
		expect(truncateDecimals(66.7)).toBe(66.7);
		expect(truncateDecimals(0.5)).toBe(0.5);
	});

	it("absorbs floating-point noise instead of dropping a real digit", () => {
		expect(truncateDecimals(0.29 * 100)).toBe(29);
		expect(truncateDecimals((29 / 100) * 100)).toBe(29);
		expect(truncateDecimals(100 - 33.3, 1)).toBe(66.7);
		expect(truncateDecimals(100 - 33.3)).toBe(66.7);
		expect(truncateDecimals(1.005)).toBe(1);
	});

	it("truncates a negative value toward zero", () => {
		expect(truncateDecimals(-3.16795)).toBe(-3.16);
		expect(truncateDecimals(-0.999)).toBe(-0.99);
	});

	it("never returns a signed zero", () => {
		expect(Object.is(truncateDecimals(-0.001), 0)).toBe(true);
		expect(Object.is(truncateDecimals(-0), 0)).toBe(true);
	});

	it("leaves an integer untouched", () => {
		expect(truncateDecimals(0)).toBe(0);
		expect(truncateDecimals(250)).toBe(250);
		expect(truncateDecimals(-12)).toBe(-12);
	});

	it("takes the number of decimals as a parameter", () => {
		expect(truncateDecimals(0.0887654, 4)).toBe(0.0887);
		expect(truncateDecimals(0.0887 * 10_000, 0)).toBe(887);
		expect(truncateDecimals(12.98, 1)).toBe(12.9);
		expect(truncateDecimals(12.98, 0)).toBe(12);
	});
});

describe("truncateRatio", () => {
	it("stores a ratio at two more decimals than the displayed percentage", () => {
		expect(RATIO_DECIMALS).toBe(DISPLAY_DECIMALS + 2);
	});

	it("truncates to 4 decimals, so the stored ratio matches the displayed percentage", () => {
		expect(truncateRatio(18 / 35)).toBe(0.5142);
		expect(truncateRatio(2 / 3)).toBe(0.6666);
		expect(truncateRatio(0.29)).toBe(0.29);
	});

	it("truncates negative ratios toward zero without producing -0", () => {
		expect(truncateRatio(-0.03168)).toBe(-0.0316);
		expect(Object.is(truncateRatio(-0.00001), 0)).toBe(true);
	});
});
