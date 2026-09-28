import { describe, expect, it } from "vitest";

import { hasRequiredDeclarationInfo } from "../shared/declarationPrerequisites";

describe("hasRequiredDeclarationInfo", () => {
	describe("when the CSE applies (GIP workforce >= 100)", () => {
		it("returns true when phone and CSE are provided", () => {
			expect(hasRequiredDeclarationInfo("0612345678", true, true)).toBe(true);
			expect(hasRequiredDeclarationInfo("0612345678", false, true)).toBe(true);
		});

		it("returns false when phone is missing", () => {
			expect(hasRequiredDeclarationInfo(null, true, true)).toBe(false);
		});

		it("returns false when CSE is null", () => {
			expect(hasRequiredDeclarationInfo("0612345678", null, true)).toBe(false);
		});

		it("returns false when both are missing", () => {
			expect(hasRequiredDeclarationInfo(null, null, true)).toBe(false);
		});

		it("returns false when phone is empty string", () => {
			expect(hasRequiredDeclarationInfo("", true, true)).toBe(false);
		});
	});

	describe("when the CSE does not apply (GIP workforce < 100 or company absent from the GIP file)", () => {
		it("returns true with only a phone, since hasCse is not collectable", () => {
			expect(hasRequiredDeclarationInfo("0612345678", null, false)).toBe(true);
		});

		it("still requires the phone", () => {
			expect(hasRequiredDeclarationInfo(null, null, false)).toBe(false);
			expect(hasRequiredDeclarationInfo("", null, false)).toBe(false);
		});

		it("ignores a legacy hasCse value left over from before the CSE gate", () => {
			expect(hasRequiredDeclarationInfo("0612345678", true, false)).toBe(true);
			expect(hasRequiredDeclarationInfo("0612345678", false, false)).toBe(true);
		});
	});
});
