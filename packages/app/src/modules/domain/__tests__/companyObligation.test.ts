import { describe, expect, it } from "vitest";

import { isObligatedForYear } from "../shared/companyObligation";

describe("isObligatedForYear", () => {
	describe("voluntary tier (workforce < 50)", () => {
		it("returns false for 10 employees in 2026", () => {
			expect(isObligatedForYear(10, 2026)).toBe(false);
		});

		it("returns false for 49 employees in 2027", () => {
			expect(isObligatedForYear(49, 2027)).toBe(false);
		});

		it("returns false for 0 employees in any year", () => {
			expect(isObligatedForYear(0, 2026)).toBe(false);
			expect(isObligatedForYear(0, 2027)).toBe(false);
		});
	});

	describe("mandatory tier (50 ≤ workforce < 100)", () => {
		it("is subject every year from V2_FIRST_CAMPAIGN_YEAR (2027 → 2033)", () => {
			for (let year = 2027; year <= 2033; year++) {
				expect(isObligatedForYear(50, year)).toBe(true);
				expect(isObligatedForYear(75, year)).toBe(true);
				expect(isObligatedForYear(99, year)).toBe(true);
			}
		});

		it("is subject on the years that used to be off-cycle (2028, 2029)", () => {
			expect(isObligatedForYear(60, 2028)).toBe(true);
			expect(isObligatedForYear(60, 2029)).toBe(true);
		});

		it("is not subject on pre-V2 years", () => {
			expect(isObligatedForYear(60, 2018)).toBe(false);
		});

		// #4240 recette bridge: 2026 plays the first V2 campaign's rules.
		it("is subject in 2026, aligned on the first V2 campaign", () => {
			expect(isObligatedForYear(60, 2026)).toBe(true);
		});
	});

	describe("mandatory-with-compliance tier (workforce ≥ 100)", () => {
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
