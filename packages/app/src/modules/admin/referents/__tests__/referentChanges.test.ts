import { describe, expect, it } from "vitest";

import { listReferentChanges } from "../referentChanges";
import type { ReferentFormValues } from "../schemas";
import type { ReferentSearchRow } from "../types";

const STORED: ReferentSearchRow = {
	id: "00000000-0000-4000-8000-000000000001",
	region: "11",
	county: "75",
	name: "Jean Dupont",
	type: "email",
	value: "jean@gouv.fr",
	principal: true,
	substituteName: null,
	substituteEmail: null,
	createdAt: new Date("2026-01-01T00:00:00Z"),
};

const UNCHANGED: ReferentFormValues = {
	region: "11",
	county: "75",
	name: "Jean Dupont",
	type: "email",
	value: "jean@gouv.fr",
	principal: true,
	substituteName: "",
	substituteEmail: "",
};

describe("listReferentChanges", () => {
	it("returns no change when the form holds the stored values", () => {
		expect(listReferentChanges(STORED, UNCHANGED)).toEqual([]);
	});

	it("treats blank optional texts as the absent value the router stores", () => {
		expect(
			listReferentChanges(STORED, {
				...UNCHANGED,
				substituteName: "   ",
				substituteEmail: "",
			}),
		).toEqual([]);
	});

	it("lists the name and e-mail changes with their previous and new values", () => {
		expect(
			listReferentChanges(STORED, {
				...UNCHANGED,
				name: "Marie Martin",
				value: "marie@gouv.fr",
			}),
		).toEqual([
			{
				field: "name",
				label: "Nom",
				previous: "Jean Dupont",
				next: "Marie Martin",
			},
			{
				field: "value",
				label: "Valeur",
				previous: "jean@gouv.fr",
				next: "marie@gouv.fr",
			},
		]);
	});

	it("shows readable labels for the principal flag, type, region and county", () => {
		const changes = listReferentChanges(STORED, {
			...UNCHANGED,
			principal: false,
			type: "url",
			value: "https://example.fr",
			region: "84",
			county: "",
		});
		expect(
			changes.map(({ label, previous, next }) => [label, previous, next]),
		).toEqual([
			["Principal", "Oui", "Non"],
			["Région", "Île-de-France (11)", "Auvergne-Rhône-Alpes (84)"],
			["Département", "Paris (75)", "—"],
			["Type de la valeur", "Email", "URL"],
			["Valeur", "jean@gouv.fr", "https://example.fr"],
		]);
	});

	it("shows an added substitute against an empty previous value", () => {
		expect(
			listReferentChanges(STORED, {
				...UNCHANGED,
				substituteName: "Paul Durand",
				substituteEmail: "paul@gouv.fr",
			}),
		).toEqual([
			{
				field: "substituteName",
				label: "Nom du suppléant",
				previous: "—",
				next: "Paul Durand",
			},
			{
				field: "substituteEmail",
				label: "Email du suppléant",
				previous: "—",
				next: "paul@gouv.fr",
			},
		]);
	});
});
