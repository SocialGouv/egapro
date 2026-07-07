import { describe, expect, it } from "vitest";

import {
	COUNTIES,
	COUNTY_CODES,
	COUNTY_TO_REGION,
	type CountyCode,
	getCountyCodeFromPostalCode,
	getLocationFromPostalCode,
	getRegionCodeFromCountyCode,
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

describe("COUNTY_TO_REGION", () => {
	it("maps every county to exactly one region", () => {
		expect(Object.keys(COUNTY_TO_REGION)).toHaveLength(101);
		for (const countyCode of COUNTY_CODES) {
			expect(COUNTY_TO_REGION).toHaveProperty(countyCode);
			expect(REGIONS_TO_COUNTIES[COUNTY_TO_REGION[countyCode]]).toContain(
				countyCode,
			);
		}
	});

	it("maps Paris to Île-de-France", () => {
		expect(COUNTY_TO_REGION["75"]).toBe("11");
	});

	it("maps a Corsican county to Corse", () => {
		expect(COUNTY_TO_REGION["2A"]).toBe("94");
	});
});

describe("getRegionCodeFromCountyCode", () => {
	it("returns the region code for a metropolitan county", () => {
		expect(getRegionCodeFromCountyCode("75")).toBe("11");
	});

	it("returns the region code for an overseas county", () => {
		expect(getRegionCodeFromCountyCode("974")).toBe("04");
	});

	it("returns null for null or undefined", () => {
		expect(getRegionCodeFromCountyCode(null)).toBeNull();
		expect(getRegionCodeFromCountyCode(undefined)).toBeNull();
	});

	it("returns null for a county absent from the region mapping", () => {
		expect(getRegionCodeFromCountyCode("99" as CountyCode)).toBeNull();
	});
});

describe("getCountyCodeFromPostalCode", () => {
	it("derives the county from a metropolitan postal code", () => {
		expect(getCountyCodeFromPostalCode("75011")).toBe("75");
		expect(getCountyCodeFromPostalCode("69001")).toBe("69");
		expect(getCountyCodeFromPostalCode("01000")).toBe("01");
	});

	it("splits Corsica on the 20200 boundary (2A below, 2B at/above)", () => {
		expect(getCountyCodeFromPostalCode("20000")).toBe("2A");
		expect(getCountyCodeFromPostalCode("20199")).toBe("2A");
		expect(getCountyCodeFromPostalCode("20200")).toBe("2B");
		expect(getCountyCodeFromPostalCode("20620")).toBe("2B");
	});

	it("derives the 3-digit code for overseas départements", () => {
		expect(getCountyCodeFromPostalCode("97100")).toBe("971");
		expect(getCountyCodeFromPostalCode("97200")).toBe("972");
		expect(getCountyCodeFromPostalCode("97300")).toBe("973");
		expect(getCountyCodeFromPostalCode("97400")).toBe("974");
		expect(getCountyCodeFromPostalCode("97600")).toBe("976");
	});

	it("trims surrounding whitespace before parsing", () => {
		expect(getCountyCodeFromPostalCode(" 75011 ")).toBe("75");
	});

	it("returns null for null, undefined or empty input", () => {
		expect(getCountyCodeFromPostalCode(null)).toBeNull();
		expect(getCountyCodeFromPostalCode(undefined)).toBeNull();
		expect(getCountyCodeFromPostalCode("")).toBeNull();
	});

	it("returns null when the format is not 5 digits", () => {
		expect(getCountyCodeFromPostalCode("7501")).toBeNull();
		expect(getCountyCodeFromPostalCode("750110")).toBeNull();
		expect(getCountyCodeFromPostalCode("7501A")).toBeNull();
	});

	it("returns null for a non-existent département", () => {
		expect(getCountyCodeFromPostalCode("99000")).toBeNull();
		expect(getCountyCodeFromPostalCode("96000")).toBeNull();
		expect(getCountyCodeFromPostalCode("97500")).toBeNull();
		expect(getCountyCodeFromPostalCode("98000")).toBeNull();
	});
});

describe("getLocationFromPostalCode", () => {
	it("resolves region, department code and label for a metropolitan postal code", () => {
		expect(getLocationFromPostalCode("75011")).toEqual({
			region: "Île-de-France",
			departmentCode: "75",
			departmentLabel: "Paris",
		});
	});

	it("resolves a Corsican postal code to its department and Corse region", () => {
		expect(getLocationFromPostalCode("20000")).toEqual({
			region: "Corse",
			departmentCode: "2A",
			departmentLabel: "Corse-du-Sud",
		});
	});

	it("resolves an overseas postal code", () => {
		expect(getLocationFromPostalCode("97400")).toEqual({
			region: "La Réunion",
			departmentCode: "974",
			departmentLabel: "La Réunion",
		});
	});

	it("returns all-null when the postal code is invalid or unknown", () => {
		const empty = {
			region: null,
			departmentCode: null,
			departmentLabel: null,
		};
		expect(getLocationFromPostalCode(null)).toEqual(empty);
		expect(getLocationFromPostalCode("")).toEqual(empty);
		expect(getLocationFromPostalCode("99999")).toEqual(empty);
	});
});
