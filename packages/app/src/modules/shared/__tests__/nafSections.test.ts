import { describe, expect, it } from "vitest";

import {
	DOMINANT_NAF_SECTIONS,
	NAF_SECTION_CODES,
	OTHER_NAF_SEGMENT,
} from "../nafSections";

describe("DOMINANT_NAF_SECTIONS", () => {
	it("keeps the five manually curated sections", () => {
		expect([...DOMINANT_NAF_SECTIONS]).toEqual(["C", "G", "M", "N", "Q"]);
	});

	it("only references valid NAF section letters", () => {
		for (const code of DOMINANT_NAF_SECTIONS) {
			expect(NAF_SECTION_CODES).toContain(code);
		}
	});
});

describe("OTHER_NAF_SEGMENT", () => {
	it("uses the French 'Autres' label for the aggregated bucket", () => {
		expect(OTHER_NAF_SEGMENT).toBe("Autres");
	});
});
