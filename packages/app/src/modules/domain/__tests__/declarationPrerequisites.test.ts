import { describe, expect, it } from "vitest";

import { hasRequiredDeclarationInfo } from "../shared/declarationPrerequisites";

describe("hasRequiredDeclarationInfo", () => {
	describe("when the CSE applies (GIP workforce >= 100)", () => {
		it("returns true when phone and CSE are provided", () => {
			expect(
				hasRequiredDeclarationInfo("[FR_PHONE_REDACTED]", true, true, false),
			).toBe(true);
			expect(
				hasRequiredDeclarationInfo("[FR_PHONE_REDACTED]", false, true, false),
			).toBe(true);
		});

		it("returns false when phone is missing", () => {
			expect(hasRequiredDeclarationInfo(null, true, true, false)).toBe(false);
		});

		it("returns false when CSE is null", () => {
			expect(
				hasRequiredDeclarationInfo("[FR_PHONE_REDACTED]", null, true, false),
			).toBe(false);
		});

		it("returns false when both are missing", () => {
			expect(hasRequiredDeclarationInfo(null, null, true, false)).toBe(false);
		});

		it("returns false when phone is empty string", () => {
			expect(hasRequiredDeclarationInfo("", true, true, false)).toBe(false);
		});
	});

	describe("when the CSE answer is frozen with a completed démarche", () => {
		it("returns true even when the frozen year was never answered", () => {
			expect(
				hasRequiredDeclarationInfo("[FR_PHONE_REDACTED]", null, true, true),
			).toBe(true);
		});

		it("still requires the phone, which stays editable", () => {
			expect(hasRequiredDeclarationInfo(null, null, true, true)).toBe(false);
			expect(hasRequiredDeclarationInfo("", null, true, true)).toBe(false);
		});

		it("accepts a frozen answer like any other", () => {
			expect(
				hasRequiredDeclarationInfo("[FR_PHONE_REDACTED]", true, true, true),
			).toBe(true);
			expect(
				hasRequiredDeclarationInfo("[FR_PHONE_REDACTED]", false, true, true),
			).toBe(true);
		});
	});

	describe("when the CSE does not apply (GIP workforce < 100 or company absent from the GIP file)", () => {
		it("returns true with only a phone, since hasCse is not collectable", () => {
			expect(
				hasRequiredDeclarationInfo("[FR_PHONE_REDACTED]", null, false, false),
			).toBe(true);
		});

		it("still requires the phone", () => {
			expect(hasRequiredDeclarationInfo(null, null, false, false)).toBe(false);
			expect(hasRequiredDeclarationInfo("", null, false, false)).toBe(false);
		});

		it("ignores a legacy hasCse value left over from before the CSE gate", () => {
			expect(
				hasRequiredDeclarationInfo("[FR_PHONE_REDACTED]", true, false, false),
			).toBe(true);
			expect(
				hasRequiredDeclarationInfo("[FR_PHONE_REDACTED]", false, false, false),
			).toBe(true);
		});
	});
});
