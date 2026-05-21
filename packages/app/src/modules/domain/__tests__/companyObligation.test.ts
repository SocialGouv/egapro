import { describe, expect, it } from "vitest";

import { isObligatedForYear } from "../shared/companyObligation";

describe("isObligatedForYear", () => {
	describe("voluntary tier (workforce < 50)", () => {
		it("returns false for 10 employees in 2026", () => {
			expect(isObligatedForYear(10, 2026)).toBe(false);
		});

		it("returns false for 49 employees in 2027 (triennial)", () => {
			expect(isObligatedForYear(49, 2027)).toBe(false);
		});

		it("returns false for 0 employees in any year", () => {
			expect(isObligatedForYear(0, 2026)).toBe(false);
			expect(isObligatedForYear(0, 2027)).toBe(false);
		});
	});

	describe("triennial tier (50 ≤ workforce < 100)", () => {
		it("returns true on the triennial base year 2027", () => {
			expect(isObligatedForYear(50, 2027)).toBe(true);
			expect(isObligatedForYear(75, 2027)).toBe(true);
			expect(isObligatedForYear(99, 2027)).toBe(true);
		});

		it("returns true on triennial-aligned years (2030, 2033)", () => {
			expect(isObligatedForYear(60, 2030)).toBe(true);
			expect(isObligatedForYear(60, 2033)).toBe(true);
		});

		it("returns false on off-cycle years (2026, 2028, 2029)", () => {
			expect(isObligatedForYear(60, 2026)).toBe(false);
			expect(isObligatedForYear(60, 2028)).toBe(false);
			expect(isObligatedForYear(60, 2029)).toBe(false);
		});
	});

	describe("annual tier (workforce ≥ 100)", () => {
		it("returns true regardless of the triennial cycle", () => {
			expect(isObligatedForYear(100, 2026)).toBe(true);
			expect(isObligatedForYear(100, 2027)).toBe(true);
			expect(isObligatedForYear(100, 2028)).toBe(true);
		});

		it("returns true for large workforces", () => {
			expect(isObligatedForYear(200, 2026)).toBe(true);
			expect(isObligatedForYear(5000, 2026)).toBe(true);
		});
	});
});
