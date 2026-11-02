import { describe, expect, it } from "vitest";

import {
	toCompanyInsertValues,
	toCompanyRefreshValues,
} from "../companyInsert";

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

	it("nulls the commune and region code when the lookup omits them", () => {
		const {
			city: _city,
			regionCode: _regionCode,
			...withoutOptional
		} = COMPANY_INFO;

		expect(toCompanyInsertValues("532847196", withoutOptional)).toMatchObject({
			city: null,
			regionCode: null,
		});
	});

	it("falls back to a bare placeholder row when the lookup found nothing", () => {
		expect(toCompanyInsertValues("532847196", null)).toEqual({
			siren: "532847196",
			name: "Entreprise 532847196",
		});
	});
});

describe("toCompanyRefreshValues", () => {
	const REFRESHED = {
		siren: "123456789",
		name: "Société Démo",
		city: "PARIS",
		regionCode: "11",
		region: "Île-de-France",
		departmentCode: "75",
		departmentLabel: "Paris",
	};

	it("drops both country columns when the resolved country is unknown, so the stored one survives", () => {
		expect(
			toCompanyRefreshValues({
				...REFRESHED,
				countryCode: null,
				countryLabel: null,
			}),
		).toEqual(REFRESHED);
	});

	it("drops nothing on the placeholder row of an unavailable registry", () => {
		const placeholder = toCompanyInsertValues("123456789", null);

		expect(toCompanyRefreshValues(placeholder)).toEqual(placeholder);
	});

	it("keeps France so it replaces the stored country", () => {
		const values = { ...REFRESHED, countryCode: null, countryLabel: "FRANCE" };

		expect(toCompanyRefreshValues(values)).toEqual(values);
	});

	it("keeps a foreign country so it replaces the stored country", () => {
		const values = {
			...REFRESHED,
			countryCode: "99131",
			countryLabel: "BELGIQUE",
		};

		expect(toCompanyRefreshValues(values)).toEqual(values);
	});
});
