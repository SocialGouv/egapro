import { describe, expect, it } from "vitest";

import { isDeclarationSubmitted } from "../confirmationHelpers";

describe("isDeclarationSubmitted", () => {
	it("returns true when status is a non-draft FSM status", () => {
		expect(isDeclarationSubmitted("demarche_completed")).toBe(true);
	});

	it("returns false when status is null", () => {
		expect(isDeclarationSubmitted(null)).toBe(false);
	});

	it("returns false when status is 'draft'", () => {
		expect(isDeclarationSubmitted("draft")).toBe(false);
	});
});
