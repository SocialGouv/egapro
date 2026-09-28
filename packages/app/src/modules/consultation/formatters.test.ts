import { describe, expect, it } from "vitest";
import {
	companyLocation,
	formatNaf,
	gapDirection,
	shareOf,
} from "./formatters";

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
