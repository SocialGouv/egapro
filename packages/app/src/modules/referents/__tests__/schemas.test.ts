import { describe, expect, it } from "vitest";

import {
	publicReferentIdSchema,
	publicSearchReferentsFormSchema,
	publicSearchReferentsSchema,
} from "../schemas";
import { PUBLIC_PAGE_SIZE } from "../shared/constants";

describe("publicSearchReferentsSchema", () => {
	it("applies default page=1 and default pageSize when omitted", () => {
		const result = publicSearchReferentsSchema.parse({});
		expect(result.page).toBe(1);
		expect(result.pageSize).toBe(PUBLIC_PAGE_SIZE);
	});

	it("coerces string pagination values (they come from URL params)", () => {
		const result = publicSearchReferentsSchema.parse({
			page: "3",
			pageSize: "50",
		});
		expect(result.page).toBe(3);
		expect(result.pageSize).toBe(50);
	});

	it("rejects pageSize below 10", () => {
		expect(() => publicSearchReferentsSchema.parse({ pageSize: 5 })).toThrow();
	});

	it("rejects pageSize above 100 to prevent scraping", () => {
		expect(() =>
			publicSearchReferentsSchema.parse({ pageSize: 500 }),
		).toThrow();
	});

	it("accepts empty-string region/county (HTML select sends empty string)", () => {
		const result = publicSearchReferentsSchema.parse({
			region: "",
			county: "",
		});
		expect(result.region).toBe("");
		expect(result.county).toBe("");
	});

	it("accepts a valid region/county code", () => {
		const result = publicSearchReferentsSchema.parse({
			region: "11",
			county: "75",
		});
		expect(result.region).toBe("11");
		expect(result.county).toBe("75");
	});

	it("rejects an unknown region code", () => {
		expect(() => publicSearchReferentsSchema.parse({ region: "99" })).toThrow();
	});

	it("trims query whitespace", () => {
		const result = publicSearchReferentsSchema.parse({
			query: "  durand  ",
		});
		expect(result.query).toBe("durand");
	});
});

describe("publicSearchReferentsFormSchema", () => {
	it("is permissive on missing fields (form initial state)", () => {
		const result = publicSearchReferentsFormSchema.parse({});
		expect(result).toEqual({});
	});

	it("accepts free-form strings (form-level, server re-validates)", () => {
		const result = publicSearchReferentsFormSchema.parse({
			query: "durand",
			region: "11",
			county: "75",
		});
		expect(result).toEqual({ query: "durand", region: "11", county: "75" });
	});
});

describe("publicReferentIdSchema", () => {
	it("accepts a valid uuid", () => {
		const uuid = "11111111-1111-4111-8111-111111111111";
		expect(publicReferentIdSchema.parse({ id: uuid }).id).toBe(uuid);
	});

	it("rejects a non-uuid string", () => {
		expect(() => publicReferentIdSchema.parse({ id: "not-a-uuid" })).toThrow();
	});
});
