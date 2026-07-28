import { describe, expect, it } from "vitest";
import {
	CATEGORY_SOURCES,
	formatCategorySource,
	SOURCE_LABELS,
} from "../sources";

describe("formatCategorySource", () => {
	it.each([
		["accord-entreprise", "Accord d'entreprise"],
		["accord-groupe", "Accord de groupe"],
		["accord-branche", "Accord de branche"],
		["decision-unilaterale", "Décision unilatérale"],
	])("labels the selectable source %s", (value, expected) => {
		expect(formatCategorySource(value)).toBe(expected);
	});

	// Regression #4014: declarations saved before #3361 carry these values and
	// used to render as raw slugs in the récapitulatif PDF.
	it.each([
		["convention-collective", "Convention collective"],
		["classification-interne", "Classification interne"],
		["autre", "Autre"],
	])("labels the legacy source %s", (value, expected) => {
		expect(formatCategorySource(value)).toBe(expected);
	});

	it("humanises an unknown value instead of exposing the raw slug", () => {
		expect(formatCategorySource("convention-maison")).toBe("Convention maison");
		expect(formatCategorySource("accord_local")).toBe("Accord local");
	});

	it("falls back to the raw value when humanising would leave it empty", () => {
		expect(formatCategorySource("")).toBe("");
		expect(formatCategorySource("-")).toBe("-");
		expect(formatCategorySource("__")).toBe("__");
	});

	it("labels a known value even if its label were falsy", () => {
		expect(formatCategorySource("autre")).toBe("Autre");
		expect(Object.keys(SOURCE_LABELS)).toContain("autre");
	});
});

describe("SOURCE_LABELS", () => {
	it("maps exactly the selectable and legacy values, and nothing else", () => {
		expect(Object.keys(SOURCE_LABELS).sort()).toEqual(
			[
				"accord-branche",
				"accord-entreprise",
				"accord-groupe",
				"autre",
				"classification-interne",
				"convention-collective",
				"decision-unilaterale",
			].sort(),
		);
	});

	it("never maps a value to an empty label", () => {
		for (const [key, label] of Object.entries(SOURCE_LABELS)) {
			expect(label, `label for ${key}`).not.toBe("");
		}
	});
});

describe("CATEGORY_SOURCES", () => {
	it("only offers the four currently selectable values", () => {
		expect(CATEGORY_SOURCES.map((s) => s.value)).toEqual([
			"accord-entreprise",
			"accord-groupe",
			"accord-branche",
			"decision-unilaterale",
		]);
	});

	it("never offers a legacy value as a selectable option", () => {
		const selectable = CATEGORY_SOURCES.map((s) => s.value) as string[];
		for (const legacy of [
			"convention-collective",
			"classification-interne",
			"autre",
		]) {
			expect(selectable).not.toContain(legacy);
			expect(SOURCE_LABELS[legacy]).toBeDefined();
		}
	});
});
