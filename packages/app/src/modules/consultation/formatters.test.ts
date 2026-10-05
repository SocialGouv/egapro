import { describe, expect, it } from "vitest";
import {
	companyLocation,
	companyPageLocation,
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

	it("names the title-cased country of a company registered abroad", () => {
		expect(
			companyLocation({
				countryCode: "99131",
				countryLabel: "BELGIQUE",
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

	it("states an unknown country when the registry located the company nowhere", () => {
		expect(
			companyLocation({
				countryCode: null,
				countryLabel: null,
				departmentLabel: null,
				region: null,
			}),
		).toEqual({ label: "Pays", value: "inconnu" });
	});

	it("states an unknown country for a country code without label", () => {
		expect(
			companyLocation({
				countryCode: "99131",
				countryLabel: null,
				departmentLabel: null,
				region: null,
			}),
		).toEqual({ label: "Pays", value: "inconnu" });
	});

	it("reads a blank country with a known département as French", () => {
		expect(
			companyLocation({
				countryCode: null,
				countryLabel: null,
				departmentLabel: "Nord",
				region: "Hauts-de-France",
			}),
		).toEqual({ label: "Adresse", value: "Nord, Hauts-de-France" });
	});

	it("shows no row for a French company with neither département nor region", () => {
		expect(
			companyLocation({
				countryCode: null,
				countryLabel: "FRANCE",
				departmentLabel: null,
				region: null,
			}),
		).toBeNull();
	});
});

describe("companyPageLocation", () => {
	const french = {
		address: "1 rue de la Paix, 75002 Paris",
		countryCode: null,
		countryLabel: "FRANCE",
		departmentLabel: "Paris",
		region: "Île-de-France",
	};

	it("shows the raw address of a French company", () => {
		expect(companyPageLocation(french)).toEqual({
			label: "Adresse",
			value: "1 rue de la Paix, 75002 Paris",
		});
	});

	it("falls back on the département and region of a French company without address", () => {
		expect(companyPageLocation({ ...french, address: null })).toEqual({
			label: "Adresse",
			value: "Paris, Île-de-France",
		});
		expect(companyPageLocation({ ...french, address: "" })).toEqual({
			label: "Adresse",
			value: "Paris, Île-de-France",
		});
	});

	it("shows no row for a French company located nowhere", () => {
		expect(
			companyPageLocation({
				...french,
				address: null,
				departmentLabel: null,
				region: null,
			}),
		).toBeNull();
	});

	it("names the country of a Belgian company, never its street", () => {
		expect(
			companyPageLocation({
				address: "12 RUE DE LA DEMO",
				countryCode: "99131",
				countryLabel: "BELGIQUE",
				departmentLabel: null,
				region: null,
			}),
		).toEqual({ label: "Pays", value: "Belgique" });
	});

	it("states an unknown country instead of an address reduced to the street", () => {
		expect(
			companyPageLocation({
				address: "12 RUE DE LA DEMO",
				countryCode: null,
				countryLabel: null,
				departmentLabel: null,
				region: null,
			}),
		).toEqual({ label: "Pays", value: "inconnu" });
	});

	it.each([
		"address",
		"countryLabel",
		"departmentLabel",
		"region",
	] as const)("collapses a masked %s to one public label", (field) => {
		expect(
			companyPageLocation({ ...french, [field]: "Non-diffusible" }),
		).toEqual({ label: "Adresse", value: "Non-diffusible" });
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
