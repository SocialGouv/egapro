import { describe, expect, it } from "vitest";

import {
	companyLocationRow,
	formatInseeTitleCase,
} from "../shared/companyLocationDisplay";

describe("formatInseeTitleCase", () => {
	it("title-cases a fully uppercase address", () => {
		expect(formatInseeTitleCase("10 RUE DE LA PAIX")).toBe("10 Rue de la Paix");
	});

	it("keeps connector words lowercase except at the start", () => {
		expect(formatInseeTitleCase("DE GAULLE")).toBe("De Gaulle");
		expect(formatInseeTitleCase("AVENUE DES CHAMPS")).toBe("Avenue des Champs");
	});

	it("handles accents", () => {
		expect(formatInseeTitleCase("PLACE DE L'ÉTOILE")).toBe("Place de l'Étoile");
	});

	it("handles multiple connector words", () => {
		expect(formatInseeTitleCase("RUE DU BOIS ET DES FLEURS")).toBe(
			"Rue du Bois et des Fleurs",
		);
	});

	it("title-cases a single-word country label", () => {
		expect(formatInseeTitleCase("QATAR")).toBe("Qatar");
	});

	it("title-cases a composed country label", () => {
		expect(formatInseeTitleCase("AFRIQUE DU SUD")).toBe("Afrique du Sud");
	});

	it("keeps the hyphen and title-cases both sides for a hyphenated country label", () => {
		expect(formatInseeTitleCase("PAYS-BAS")).toBe("Pays-Bas");
	});

	it("handles an apostrophe in a country label", () => {
		expect(formatInseeTitleCase("CÔTE D'IVOIRE")).toBe("Côte d'Ivoire");
	});
});

describe("companyLocationRow", () => {
	const unknown = { label: "Pays", value: "inconnu" };

	it("names the title-cased country of a company registered abroad, never its address", () => {
		expect(
			companyLocationRow({
				countryCode: "99131",
				countryLabel: "BELGIQUE",
				departmentLabel: null,
				domesticAddress: "12 Rue de la Demo",
			}),
		).toEqual({ label: "Pays", value: "Belgique" });
	});

	it("shows the address of a French company", () => {
		expect(
			companyLocationRow({
				countryCode: null,
				countryLabel: "FRANCE",
				departmentLabel: "Paris",
				domesticAddress: "10 Rue de la Paix",
			}),
		).toEqual({ label: "Adresse", value: "10 Rue de la Paix" });
	});

	it("shows no row for a French company without address", () => {
		expect(
			companyLocationRow({
				countryCode: null,
				countryLabel: "FRANCE",
				departmentLabel: null,
				domesticAddress: null,
			}),
		).toBeNull();
	});

	it("treats an empty address as missing", () => {
		expect(
			companyLocationRow({
				countryCode: null,
				countryLabel: "FRANCE",
				departmentLabel: "Paris",
				domesticAddress: "",
			}),
		).toBeNull();
	});

	it("reads a blank country with a known French département as French", () => {
		expect(
			companyLocationRow({
				countryCode: null,
				countryLabel: null,
				departmentLabel: "Nord",
				domesticAddress: "1 Rue du Nord",
			}),
		).toEqual({ label: "Adresse", value: "1 Rue du Nord" });
		expect(
			companyLocationRow({
				countryCode: null,
				countryLabel: null,
				departmentLabel: "Nord",
				domesticAddress: null,
			}),
		).toBeNull();
	});

	it("states an unknown country even when an address is stored", () => {
		expect(
			companyLocationRow({
				countryCode: null,
				countryLabel: null,
				departmentLabel: null,
				domesticAddress: "12 RUE DE LA DEMO",
			}),
		).toEqual(unknown);
	});

	it("states an unknown country for a country code without label", () => {
		expect(
			companyLocationRow({
				countryCode: "99131",
				countryLabel: null,
				departmentLabel: "Nord",
				domesticAddress: "1 Rue du Nord",
			}),
		).toEqual(unknown);
	});
});
