import { describe, expect, it } from "vitest";

import { hasRequiredDeclarationInfo } from "../shared/declarationPrerequisites";

describe("hasRequiredDeclarationInfo", () => {
	it("returns true when phone and CSE are provided", () => {
		expect(hasRequiredDeclarationInfo("0612345678", true)).toBe(true);
		expect(hasRequiredDeclarationInfo("0612345678", false)).toBe(true);
	});

	it("returns false when phone is missing", () => {
		expect(hasRequiredDeclarationInfo(null, true)).toBe(false);
	});

	it("returns false when CSE is null", () => {
		expect(hasRequiredDeclarationInfo("0612345678", null)).toBe(false);
	});

	it("returns false when both are missing", () => {
		expect(hasRequiredDeclarationInfo(null, null)).toBe(false);
	});

	it("returns false when phone is empty string", () => {
		expect(hasRequiredDeclarationInfo("", true)).toBe(false);
	});
});
