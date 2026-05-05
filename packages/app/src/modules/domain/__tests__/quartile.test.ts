import { describe, expect, it } from "vitest";
import {
	computeQuartileMin,
	migrateLegacyThresholds,
} from "../shared/quartile";

describe("computeQuartileMin", () => {
	it("returns null for null", () => {
		expect(computeQuartileMin(null)).toBeNull();
	});

	it("returns null for undefined", () => {
		expect(computeQuartileMin(undefined)).toBeNull();
	});

	it("returns null for empty string", () => {
		expect(computeQuartileMin("")).toBeNull();
	});

	it("returns null for non-numeric string", () => {
		expect(computeQuartileMin("not-a-number")).toBeNull();
	});

	it('returns "0.01" for "0"', () => {
		expect(computeQuartileMin("0")).toBe("0.01");
	});

	it('returns "20000.01" for "20000"', () => {
		expect(computeQuartileMin("20000")).toBe("20000.01");
	});

	it('returns "35000.51" for "35000.50"', () => {
		expect(computeQuartileMin("35000.50")).toBe("35000.51");
	});
});

describe("migrateLegacyThresholds", () => {
	it("returns 3-element tuple unchanged", () => {
		expect(migrateLegacyThresholds(["a", "b", "c"])).toEqual(["a", "b", "c"]);
	});

	it("ignores 4th element in legacy 4-threshold array", () => {
		expect(migrateLegacyThresholds(["a", "b", "c", "d"])).toEqual([
			"a",
			"b",
			"c",
		]);
	});

	it("normalizes null and undefined to empty string", () => {
		expect(migrateLegacyThresholds([null, undefined, "x"])).toEqual([
			"",
			"",
			"x",
		]);
	});

	it("returns empty strings for empty array", () => {
		expect(migrateLegacyThresholds([])).toEqual(["", "", ""]);
	});
});
