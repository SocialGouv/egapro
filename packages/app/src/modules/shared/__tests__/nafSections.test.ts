import { describe, expect, it } from "vitest";

import {
	classifyNafSegment,
	DOMINANT_NAF_SECTIONS,
	OTHER_NAF_SEGMENT,
} from "../nafSections";

describe("classifyNafSegment", () => {
	it("returns the letter prefix for dominant sections", () => {
		for (const section of DOMINANT_NAF_SECTIONS) {
			expect(classifyNafSegment(`${section}01.11Z`)).toBe(section);
		}
	});

	it("returns 'Autres' for non-dominant but valid sections", () => {
		// A, B, D, E, F, H, I, J, K, L, O, P, R, S, T, U are non-dominant.
		expect(classifyNafSegment("A01.11Z")).toBe(OTHER_NAF_SEGMENT);
		expect(classifyNafSegment("K64.19Z")).toBe(OTHER_NAF_SEGMENT);
		expect(classifyNafSegment("U99.00Z")).toBe(OTHER_NAF_SEGMENT);
	});

	it("normalises the letter case", () => {
		expect(classifyNafSegment("c10.11z")).toBe("C");
	});

	it("returns null for null, empty, or invalid prefixes", () => {
		expect(classifyNafSegment(null)).toBeNull();
		expect(classifyNafSegment("")).toBeNull();
		expect(classifyNafSegment("99.00Z")).toBeNull(); // starts with digit
		expect(classifyNafSegment("Z99.00Z")).toBeNull(); // Z is not a NAF section
	});
});
