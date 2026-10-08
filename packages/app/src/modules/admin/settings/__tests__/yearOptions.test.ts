import { describe, expect, it } from "vitest";

import { FIRST_DECLARATION_YEAR, getCurrentYear } from "~/modules/domain";

import { buildYearOptions } from "../yearOptions";

describe("buildYearOptions", () => {
	it("spans from the first declaration year to ten years ahead", () => {
		const options = buildYearOptions([]);
		expect(options[0]?.year).toBe(FIRST_DECLARATION_YEAR);
		expect(options.at(-1)?.year).toBe(getCurrentYear() + 10);
	});

	it("flags only the years that are not configured", () => {
		const options = buildYearOptions([FIRST_DECLARATION_YEAR]);
		expect(options[0]?.label).toBe(String(FIRST_DECLARATION_YEAR));
		expect(options[1]?.label).toBe(
			`${FIRST_DECLARATION_YEAR + 1} (non configurée)`,
		);
	});
});
