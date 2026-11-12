import { describe, expect, it } from "vitest";

import {
	companyPlaceholderName,
	isCompanyIdentityUnresolved,
} from "../shared/companyIdentity";

const SIREN = "123456789";

describe("companyPlaceholderName", () => {
	it("names the company after its SIREN", () => {
		expect(companyPlaceholderName(SIREN)).toBe("Entreprise 123456789");
	});
});

describe("isCompanyIdentityUnresolved", () => {
	const placeholder = {
		siren: SIREN,
		name: companyPlaceholderName(SIREN),
		address: null,
		nafCode: null,
		countryLabel: null,
		departmentLabel: null,
	};

	it("flags the row the registry never answered for", () => {
		expect(isCompanyIdentityUnresolved(placeholder)).toBe(true);
	});

	it("flags it when the optional columns are simply absent", () => {
		expect(
			isCompanyIdentityUnresolved({
				siren: SIREN,
				name: companyPlaceholderName(SIREN),
			}),
		).toBe(true);
	});

	it("keeps a resolved identity even when the address is naturally absent", () => {
		expect(
			isCompanyIdentityUnresolved({ ...placeholder, name: "Société Démo" }),
		).toBe(false);
	});

	it("keeps a nameless unit the registry answered for", () => {
		expect(
			isCompanyIdentityUnresolved({
				...placeholder,
				address: "1 RUE DE LA DEMO, 75001 PARIS",
			}),
		).toBe(false);
	});

	it("keeps a nameless unit known only through its NAF code", () => {
		expect(
			isCompanyIdentityUnresolved({ ...placeholder, nafCode: "62.01Z" }),
		).toBe(false);
	});

	it("keeps a nameless unit known only through its country", () => {
		expect(
			isCompanyIdentityUnresolved({ ...placeholder, countryLabel: "FRANCE" }),
		).toBe(false);
	});

	it("keeps a nameless foreign unit known only through its department", () => {
		expect(
			isCompanyIdentityUnresolved({ ...placeholder, departmentLabel: "Paris" }),
		).toBe(false);
	});

	it("does not confuse a company whose name echoes the placeholder of another SIREN", () => {
		expect(
			isCompanyIdentityUnresolved({
				...placeholder,
				name: companyPlaceholderName("987654321"),
			}),
		).toBe(false);
	});
});
