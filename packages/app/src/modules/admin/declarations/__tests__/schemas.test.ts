import { describe, expect, it } from "vitest";

import { getDeclarationByIdSchema, searchDeclarationsSchema } from "../schemas";

describe("searchDeclarationsSchema", () => {
	it("accepts minimal input with defaults", () => {
		const result = searchDeclarationsSchema.parse({});
		expect(result).toEqual({
			page: 1,
			pageSize: 20,
			sortBy: "createdAt",
			sortOrder: "desc",
		});
	});

	it("parses all fields", () => {
		const result = searchDeclarationsSchema.parse({
			query: "ACME",
			email: "test@example.com",
			year: "2024",
			dateFrom: "2024-01-01",
			dateTo: "2024-12-31",
			index: "75",
			indexOperator: "gt",
			status: "submitted",
			page: "2",
			pageSize: "50",
			sortBy: "companyName",
			sortOrder: "asc",
		});

		expect(result).toEqual({
			query: "ACME",
			email: "test@example.com",
			year: 2024,
			dateFrom: "2024-01-01",
			dateTo: "2024-12-31",
			index: 75,
			indexOperator: "gt",
			status: "submitted",
			page: 2,
			pageSize: 50,
			sortBy: "companyName",
			sortOrder: "asc",
		});
	});

	it("accepts empty email string", () => {
		const result = searchDeclarationsSchema.parse({ email: "" });
		expect(result.email).toBe("");
	});

	it("rejects invalid year", () => {
		expect(() => searchDeclarationsSchema.parse({ year: "2000" })).toThrow();
	});

	it("rejects invalid sort column", () => {
		expect(() =>
			searchDeclarationsSchema.parse({ sortBy: "nonexistent" }),
		).toThrow();
	});

	it("rejects page size over 100", () => {
		expect(() => searchDeclarationsSchema.parse({ pageSize: "200" })).toThrow();
	});
});

describe("getDeclarationByIdSchema", () => {
	it("accepts a valid UUID", () => {
		const id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
		const result = getDeclarationByIdSchema.parse({ id });
		expect(result.id).toBe(id);
	});

	it("rejects a non-UUID string", () => {
		expect(() =>
			getDeclarationByIdSchema.parse({ id: "not-a-uuid" }),
		).toThrow();
	});
});
