import { describe, expect, it } from "vitest";

import { toCompanyInsertValues } from "../companyInsert";

describe("toCompanyInsertValues", () => {
	const COMPANY_INFO = {
		name: "Alpha Solutions",
		address: "12 RUE DES INNOVATEURS, 75011 PARIS",
		city: "PARIS",
		nafCode: "6202A",
		nafLabel: "Conseil en systèmes et logiciels informatiques",
		regionCode: "11",
		region: "Île-de-France",
		departmentCode: "75",
		departmentLabel: "Paris",
		countryCode: null,
		countryLabel: "FRANCE",
		workforce: 256,
		statutDiffusion: "O",
	};

	it("carries every lookup field onto the insert shape, country included", () => {
		expect(toCompanyInsertValues("532847196", COMPANY_INFO)).toEqual({
			siren: "532847196",
			...COMPANY_INFO,
		});
	});

	it("carries a foreign country onto the insert shape", () => {
		expect(
			toCompanyInsertValues("987654321", {
				...COMPANY_INFO,
				countryCode: "99248",
				countryLabel: "QATAR",
			}),
		).toMatchObject({ countryCode: "99248", countryLabel: "QATAR" });
	});

	it("falls back to a bare placeholder row when the lookup found nothing", () => {
		expect(toCompanyInsertValues("532847196", null)).toEqual({
			siren: "532847196",
			name: "Entreprise 532847196",
		});
	});
});
