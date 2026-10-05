import { describe, expect, it } from "vitest";

import {
	FRANCE_COUNTRY,
	headOfficeCountry,
	isUnknownCountry,
	legalUnitCountry,
	UNKNOWN_COUNTRY,
} from "~/modules/domain";

const BELGIUM = { countryCode: "99131", countryLabel: "BELGIQUE" };

describe("FRANCE_COUNTRY / UNKNOWN_COUNTRY", () => {
	it("marks France by its label alone, with no COG code", () => {
		expect(FRANCE_COUNTRY).toEqual({
			countryCode: null,
			countryLabel: "FRANCE",
		});
	});

	it("marks the unknown state by an empty pair", () => {
		expect(UNKNOWN_COUNTRY).toEqual({ countryCode: null, countryLabel: null });
	});
});

describe("isUnknownCountry", () => {
	it.each([
		["a null label", { countryLabel: null }],
		["an absent label", {}],
		["the unknown pair", UNKNOWN_COUNTRY],
	])("is true for %s", (_case, country) => {
		expect(isUnknownCountry(country)).toBe(true);
	});

	it.each([
		["France", FRANCE_COUNTRY],
		["a foreign country", BELGIUM],
	])("is false for %s", (_case, country) => {
		expect(isUnknownCountry(country)).toBe(false);
	});
});

describe("legalUnitCountry", () => {
	it("returns the declared foreign country, even next to a French-looking postal code", () => {
		expect(
			legalUnitCountry({
				postalCode: "10001",
				declaredCode: "99404",
				declaredLabel: "ETATS-UNIS",
			}),
		).toEqual({ countryCode: "99404", countryLabel: "ETATS-UNIS" });
	});

	it("truncates the declared label to the column width", () => {
		const country = legalUnitCountry({
			postalCode: null,
			declaredCode: "99131",
			declaredLabel: "B".repeat(300),
		});

		expect(country?.countryLabel).toHaveLength(255);
	});

	it.each([
		["a code without a label", "99131", null],
		["a label without a code", null, "BELGIQUE"],
		["a code longer than five characters", "991310", "BELGIQUE"],
	])("returns the unknown country for %s, never France", (_case, declaredCode, declaredLabel) => {
		expect(
			legalUnitCountry({ postalCode: "75002", declaredCode, declaredLabel }),
		).toBe(UNKNOWN_COUNTRY);
	});

	it("returns France when only a postal code is present", () => {
		expect(
			legalUnitCountry({
				postalCode: "75002",
				declaredCode: null,
				declaredLabel: null,
			}),
		).toBe(FRANCE_COUNTRY);
	});

	it("returns null when nothing decides it, so the head office must be asked", () => {
		expect(
			legalUnitCountry({
				postalCode: null,
				declaredCode: null,
				declaredLabel: null,
			}),
		).toBeNull();
	});
});

describe("headOfficeCountry", () => {
	const belgianHeadOffice = {
		codepaysetrangeretablissement: "99131",
		libellepaysetrangeretablissement: "BELGIQUE",
	};

	it("reads the bare establishment object", () => {
		expect(headOfficeCountry(belgianHeadOffice)).toEqual(BELGIUM);
	});

	it("reads the first row of the paginated envelope", () => {
		expect(
			headOfficeCountry({ content: [belgianHeadOffice], totalElements: 1 }),
		).toEqual(BELGIUM);
	});

	it("truncates the head-office label to the column width", () => {
		expect(
			headOfficeCountry({
				codepaysetrangeretablissement: "99131",
				libellepaysetrangeretablissement: "B".repeat(300),
			}).countryLabel,
		).toHaveLength(255);
	});

	it.each([
		["a null payload", null],
		["a non-object payload", "BELGIQUE"],
		["an empty envelope", { content: [] }],
		["an envelope whose first row is not an object", { content: [42] }],
		[
			"a head office located in France",
			{
				codepaysetrangeretablissement: null,
				libellepaysetrangeretablissement: null,
			},
		],
		["a code without a label", { codepaysetrangeretablissement: "99131" }],
		[
			"a code longer than five characters",
			{
				codepaysetrangeretablissement: "991310",
				libellepaysetrangeretablissement: "BELGIQUE",
			},
		],
		[
			"non-string country fields",
			{
				codepaysetrangeretablissement: 99131,
				libellepaysetrangeretablissement: ["BELGIQUE"],
			},
		],
	])("returns the unknown country for %s", (_case, payload) => {
		expect(headOfficeCountry(payload)).toBe(UNKNOWN_COUNTRY);
	});
});
