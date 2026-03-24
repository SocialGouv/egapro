import { describe, expect, it } from "vitest";

import {
	hasSubmittedSecondDeclaration,
	isDeclarationSubmitted,
} from "../confirmationHelpers";

describe("hasSubmittedSecondDeclaration", () => {
	it("returns true when status is 'submitted'", () => {
		expect(hasSubmittedSecondDeclaration("submitted")).toBe(true);
	});

	it("returns false when status is null", () => {
		expect(hasSubmittedSecondDeclaration(null)).toBe(false);
	});

	it("returns false when status is 'draft'", () => {
		expect(hasSubmittedSecondDeclaration("draft")).toBe(false);
	});
});

describe("isDeclarationSubmitted", () => {
	it("returns true when status is 'submitted'", () => {
		expect(isDeclarationSubmitted("submitted")).toBe(true);
	});

	it("returns false when status is null", () => {
		expect(isDeclarationSubmitted(null)).toBe(false);
	});

	it("returns false when status is 'draft'", () => {
		expect(isDeclarationSubmitted("draft")).toBe(false);
	});
});
