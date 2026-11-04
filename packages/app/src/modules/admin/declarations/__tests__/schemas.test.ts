import { describe, expect, it } from "vitest";

import {
	COMPANY_SIZE_RANGES,
	type CompanySizeRange,
	DECLARATION_FSM_STATUSES,
	DEMARCHE_LIFECYCLE_STATUSES,
} from "~/modules/domain";
import {
	getDeclarationByIdSchema,
	releaseLockSchema,
	SORT_COLUMNS,
	searchDeclarationsFormSchema,
	searchDeclarationsSchema,
} from "../schemas";

const COMPANY_SIZE_RANGE_KEYS = Object.keys(
	COMPANY_SIZE_RANGES,
) as CompanySizeRange[];

describe("searchDeclarationsSchema", () => {
	it("accepts minimal input with defaults", () => {
		const result = searchDeclarationsSchema.parse({});
		expect(result).toEqual({
			page: 1,
			pageSize: 20,
			sortBy: "statusDate",
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
			status: "in_progress",
			sizeRange: "100-149",
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
			status: "in_progress",
			sizeRange: "100-149",
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

describe("admin declaration status filter vocabulary", () => {
	it.each(
		DEMARCHE_LIFECYCLE_STATUSES,
	)("searchDeclarationsSchema accepts the démarche status %s", (status) => {
		expect(searchDeclarationsSchema.parse({ status }).status).toBe(status);
	});

	it("searchDeclarationsSchema rejects a status outside the vocabulary", () => {
		expect(() =>
			searchDeclarationsSchema.parse({ status: "not_a_status" }),
		).toThrow();
	});

	it.each(
		DECLARATION_FSM_STATUSES.filter((status) => status !== "draft"),
	)("searchDeclarationsSchema no longer accepts the engine state %s", (status) => {
		expect(() => searchDeclarationsSchema.parse({ status })).toThrow();
	});

	it("searchDeclarationsFormSchema accepts the empty « all statuses » option", () => {
		expect(searchDeclarationsFormSchema.parse({ status: "" }).status).toBe("");
	});

	it.each(
		DEMARCHE_LIFECYCLE_STATUSES,
	)("searchDeclarationsFormSchema accepts the démarche status %s", (status) => {
		expect(searchDeclarationsFormSchema.parse({ status }).status).toBe(status);
	});
});

describe("admin declaration size bracket vocabulary", () => {
	// Built by iterating the domain constant — never a hand-copied list of bounds.
	it.each(
		COMPANY_SIZE_RANGE_KEYS,
	)("searchDeclarationsSchema accepts the domain bracket %s", (sizeRange) => {
		expect(searchDeclarationsSchema.parse({ sizeRange }).sizeRange).toBe(
			sizeRange,
		);
	});

	it("rejects a bracket outside the domain constant", () => {
		expect(() =>
			searchDeclarationsSchema.parse({ sizeRange: "1000+" }),
		).toThrow();
	});

	it("leaves the bracket undefined when it is not given", () => {
		expect(searchDeclarationsSchema.parse({}).sizeRange).toBeUndefined();
	});

	it.each(
		COMPANY_SIZE_RANGE_KEYS,
	)("searchDeclarationsFormSchema accepts the domain bracket %s", (sizeRange) => {
		expect(searchDeclarationsFormSchema.parse({ sizeRange }).sizeRange).toBe(
			sizeRange,
		);
	});

	it("searchDeclarationsFormSchema accepts the empty « all sizes » option", () => {
		expect(
			searchDeclarationsFormSchema.parse({ sizeRange: "" }).sizeRange,
		).toBe("");
	});
});

describe("sortable columns", () => {
	it("offers the workforce column between year and démarche status", () => {
		expect(SORT_COLUMNS.indexOf("workforce")).toBe(
			SORT_COLUMNS.indexOf("year") + 1,
		);
		expect(SORT_COLUMNS.indexOf("demarcheStatus")).toBe(
			SORT_COLUMNS.indexOf("workforce") + 1,
		);
	});

	it.each([
		"status",
		"createdAt",
	])("rejects the retired sort key %s", (column) => {
		expect(() => searchDeclarationsSchema.parse({ sortBy: column })).toThrow();
	});

	it.each(
		SORT_COLUMNS,
	)("searchDeclarationsSchema accepts sortBy=%s", (column) => {
		expect(searchDeclarationsSchema.parse({ sortBy: column }).sortBy).toBe(
			column,
		);
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

describe("releaseLockSchema", () => {
	it("accepts a valid UUID declarationId", () => {
		const result = releaseLockSchema.safeParse({
			declarationId: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
		});
		expect(result.success).toBe(true);
	});

	it.each([
		"",
		"not-a-uuid",
		"123456789",
	])("rejects a non-UUID declarationId %s", (declarationId) => {
		expect(releaseLockSchema.safeParse({ declarationId }).success).toBe(false);
	});
});
