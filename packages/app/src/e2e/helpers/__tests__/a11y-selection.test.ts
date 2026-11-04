import { describe, expect, it } from "vitest";

import { isPageSelected, parsePageSelection } from "../a11y-selection";

describe("parsePageSelection", () => {
	it("selects every page when the variable is unset", () => {
		expect(parsePageSelection(undefined)).toBeNull();
	});

	it("selects every page when the variable is empty or only separators", () => {
		expect(parsePageSelection("")).toBeNull();
		expect(parsePageSelection(" , ,")).toBeNull();
	});

	it("reads comma-separated ids, trimmed, without empty entries", () => {
		expect(parsePageSelection("accueil, faq,,admin-plan ")).toEqual(
			new Set(["accueil", "faq", "admin-plan"]),
		);
	});
});

describe("isPageSelected", () => {
	it("keeps every page without a selection", () => {
		expect(isPageSelected("accueil", null)).toBe(true);
	});

	it("keeps only the selected ids", () => {
		const pages = parsePageSelection("faq,login");
		expect(isPageSelected("faq", pages)).toBe(true);
		expect(isPageSelected("login", pages)).toBe(true);
		expect(isPageSelected("accueil", pages)).toBe(false);
	});

	it("never matches an id by prefix", () => {
		const pages = parsePageSelection("declaration-etape-1");
		expect(isPageSelected("declaration-etape-10", pages)).toBe(false);
		expect(isPageSelected("declaration-etape", pages)).toBe(false);
	});
});
