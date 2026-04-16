import { describe, expect, it } from "vitest";

import {
	COUNTIES,
	COUNTY_CODES,
	REGION_CODES,
	REGIONS,
	REGIONS_TO_COUNTIES,
} from "../shared/regions";

describe("REGIONS", () => {
	it("has 18 regions", () => {
		expect(Object.keys(REGIONS)).toHaveLength(18);
	});

	it("REGION_CODES matches REGIONS keys", () => {
		expect(REGION_CODES).toEqual(Object.keys(REGIONS));
	});

	it("includes Île-de-France", () => {
		expect(REGIONS["11"]).toBe("Île-de-France");
	});
});

describe("COUNTIES", () => {
	it("has 101 counties", () => {
		expect(Object.keys(COUNTIES)).toHaveLength(101);
	});

	it("COUNTY_CODES matches COUNTIES keys", () => {
		expect(COUNTY_CODES).toEqual(Object.keys(COUNTIES));
	});

	it("includes Paris", () => {
		expect(COUNTIES["75"]).toBe("Paris");
	});

	it("includes overseas departments", () => {
		expect(COUNTIES["971"]).toBe("Guadeloupe");
		expect(COUNTIES["976"]).toBe("Mayotte");
	});
});

describe("REGIONS_TO_COUNTIES", () => {
	it("maps all 18 regions", () => {
		expect(Object.keys(REGIONS_TO_COUNTIES)).toHaveLength(18);
	});

	it("Île-de-France contains Paris", () => {
		expect(REGIONS_TO_COUNTIES["11"]).toContain("75");
	});

	it("every county in the mapping exists in COUNTIES", () => {
		for (const counties of Object.values(REGIONS_TO_COUNTIES)) {
			for (const code of counties) {
				expect(COUNTIES).toHaveProperty(code);
			}
		}
	});
});
