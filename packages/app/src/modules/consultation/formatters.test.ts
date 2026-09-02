import { describe, expect, it } from "vitest";
import {
	companyLocation,
	formatCount,
	formatGap,
	formatNaf,
	formatPercent,
	gapDirection,
	MISSING_VALUE,
	shareOf,
} from "./formatters";

describe("formatGap", () => {
	it("turns the stored 0-1 ratio into a percentage", () => {
		expect(formatGap(0.0717)).toBe("7,17 %");
	});

	it("marks a missing gap rather than printing a zero", () => {
		expect(formatGap(null)).toBe(MISSING_VALUE);
	});
});

describe("formatPercent", () => {
	it("leaves a value already on the 0-100 scale alone", () => {
		expect(formatPercent(66.7)).toBe("66,7 %");
	});
});

describe("formatCount", () => {
	it("groups thousands with the French narrow no-break space", () => {
		expect(formatCount(2256)).toBe("2\u202f256");
	});
});

describe("shareOf", () => {
	it("computes the share of a total", () => {
		expect(shareOf(752, 2256)).toBeCloseTo(33.33, 2);
	});

	it("returns null rather than dividing by zero", () => {
		expect(shareOf(0, 0)).toBeNull();
		expect(shareOf(null, 100)).toBeNull();
	});
});

describe("gapDirection", () => {
	it("reads a positive gap as favouring men", () => {
		expect(gapDirection(0.05)).toEqual({
			prefix: "Écart en faveur des ",
			emphasis: "hommes",
		});
	});

	it("reads a negative gap as favouring women", () => {
		expect(gapDirection(-0.05).emphasis).toBe("femmes");
	});

	it("states a nil gap and a missing one differently", () => {
		expect(gapDirection(0).prefix).toBe("Aucun écart constaté");
		expect(gapDirection(null).prefix).toBe("Donnée non disponible");
	});
});

describe("companyLocation", () => {
	it("names the département and the region of a French company", () => {
		expect(
			companyLocation({
				countryCode: null,
				countryLabel: "FRANCE",
				departmentLabel: "Nord",
				region: "Hauts-de-France",
			}),
		).toEqual({ label: "Adresse", value: "Nord, Hauts-de-France" });
	});

	it("names the country of a company registered abroad", () => {
		expect(
			companyLocation({
				countryCode: "BE",
				countryLabel: "Belgique",
				departmentLabel: null,
				region: null,
			}),
		).toEqual({ label: "Pays", value: "Belgique" });
	});

	it("collapses masked location fields to one public label", () => {
		expect(
			companyLocation({
				countryCode: "Non-diffusible",
				countryLabel: "Non-diffusible",
				departmentLabel: "Non-diffusible",
				region: "Non-diffusible",
			}),
		).toEqual({ label: "Adresse", value: "Non-diffusible" });
	});

	it("returns nothing when the registry located the company nowhere", () => {
		expect(
			companyLocation({
				countryCode: null,
				countryLabel: null,
				departmentLabel: null,
				region: null,
			}),
		).toBeNull();
	});
});

describe("formatNaf", () => {
	it("formats a diffusible activity without duplicating missing values", () => {
		expect(formatNaf("62.01Z", "Programmation informatique")).toBe(
			"Programmation informatique (62.01Z)",
		);
		expect(formatNaf("62.01Z", null)).toBe("62.01Z");
	});

	it("collapses masked code and label to one public label", () => {
		expect(formatNaf("Non-diffusible", "Non-diffusible")).toBe(
			"Non-diffusible",
		);
	});
});
