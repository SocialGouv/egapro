import { describe, expect, it } from "vitest";

import {
	createReferentSchema,
	deleteReferentsSchema,
	editReferentSchema,
	importReferentsSchema,
	referentFormSchema,
	searchReferentsSchema,
} from "../schemas";

describe("searchReferentsSchema", () => {
	it("accepts minimal input with defaults", () => {
		const result = searchReferentsSchema.parse({});
		expect(result).toEqual({
			page: 1,
			pageSize: 20,
			sortBy: "region",
			sortOrder: "asc",
		});
	});

	it("parses all fields", () => {
		const result = searchReferentsSchema.parse({
			query: "Dupont",
			region: "11",
			county: "75",
			page: "2",
			pageSize: "50",
			sortBy: "name",
			sortOrder: "desc",
		});
		expect(result).toEqual({
			query: "Dupont",
			region: "11",
			county: "75",
			page: 2,
			pageSize: 50,
			sortBy: "name",
			sortOrder: "desc",
		});
	});

	it("accepts empty region/county strings", () => {
		const result = searchReferentsSchema.parse({
			region: "",
			county: "",
		});
		expect(result.region).toBe("");
		expect(result.county).toBe("");
	});

	it("rejects invalid region", () => {
		expect(() => searchReferentsSchema.parse({ region: "ZZ" })).toThrow();
	});

	it("rejects invalid sort column", () => {
		expect(() =>
			searchReferentsSchema.parse({ sortBy: "nonexistent" }),
		).toThrow();
	});
});

describe("createReferentSchema", () => {
	it("validates an email referent", () => {
		const result = createReferentSchema.parse({
			region: "11",
			name: "Jean DUPONT",
			type: "email",
			value: "jean@gouv.fr",
			principal: true,
		});
		expect(result.type).toBe("email");
		expect(result.value).toBe("jean@gouv.fr");
	});

	it("validates a URL referent", () => {
		const result = createReferentSchema.parse({
			region: "84",
			county: "69",
			name: "DREETS ARA",
			type: "url",
			value: "https://dreets.gouv.fr",
		});
		expect(result.type).toBe("url");
	});

	it("rejects invalid email", () => {
		expect(() =>
			createReferentSchema.parse({
				region: "11",
				name: "Test",
				type: "email",
				value: "not-an-email",
			}),
		).toThrow();
	});

	it("rejects invalid URL", () => {
		expect(() =>
			createReferentSchema.parse({
				region: "11",
				name: "Test",
				type: "url",
				value: "not-a-url",
			}),
		).toThrow();
	});

	it("rejects empty name", () => {
		expect(() =>
			createReferentSchema.parse({
				region: "11",
				name: "",
				type: "email",
				value: "test@gouv.fr",
			}),
		).toThrow();
	});
});

describe("editReferentSchema", () => {
	it("requires an id", () => {
		const result = editReferentSchema.parse({
			id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
			region: "11",
			name: "Jean DUPONT",
			type: "email",
			value: "jean@gouv.fr",
		});
		expect(result.id).toBe("a1b2c3d4-e5f6-7890-abcd-ef1234567890");
	});

	it("rejects missing id", () => {
		expect(() =>
			editReferentSchema.parse({
				region: "11",
				name: "Test",
				type: "email",
				value: "test@gouv.fr",
			}),
		).toThrow();
	});
});

describe("deleteReferentsSchema", () => {
	it("accepts an array of UUIDs", () => {
		const ids = [
			"a1b2c3d4-e5f6-7890-abcd-ef1234567890",
			"b2c3d4e5-f6a7-8901-bcde-f12345678901",
		];
		const result = deleteReferentsSchema.parse({ ids });
		expect(result.ids).toEqual(ids);
	});

	it("rejects empty array", () => {
		expect(() => deleteReferentsSchema.parse({ ids: [] })).toThrow();
	});
});

describe("importReferentsSchema", () => {
	it("validates an array of referents", () => {
		const result = importReferentsSchema.parse([
			{
				region: "11",
				name: "Jean DUPONT",
				type: "email",
				value: "jean@gouv.fr",
			},
			{
				region: "84",
				name: "DREETS ARA",
				type: "url",
				value: "https://dreets.gouv.fr",
			},
		]);
		expect(result).toHaveLength(2);
	});

	it("rejects empty array", () => {
		expect(() => importReferentsSchema.parse([])).toThrow();
	});
});

describe("referentFormSchema", () => {
	it("validates form data", () => {
		const result = referentFormSchema.parse({
			region: "11",
			name: "Test",
			type: "email",
			value: "test@gouv.fr",
			principal: false,
		});
		expect(result.principal).toBe(false);
	});
});
