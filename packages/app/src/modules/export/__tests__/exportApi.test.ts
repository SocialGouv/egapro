import { describe, expect, it, vi } from "vitest";

// Mock DB: main query (declarations join) returns via mockMainWhere,
// sub-queries (categories, indicatorG, CSE) all return via mockSubWhere.
const mockMainWhere = vi.fn();
const mockInnerJoin2 = vi.fn(() => ({ where: mockMainWhere }));
const mockInnerJoin1 = vi.fn(() => ({ innerJoin: mockInnerJoin2 }));
const mockMainFrom = vi.fn(() => ({ innerJoin: mockInnerJoin1 }));

const mockSubWhere = vi.fn().mockResolvedValue([]);
const mockSubInnerJoin = vi.fn(() => ({ where: mockSubWhere }));
const mockSubFrom = vi.fn(() => ({
	where: mockSubWhere,
	innerJoin: mockSubInnerJoin,
}));

let selectCallCount = 0;
const mockSelect = vi.fn(() => {
	selectCallCount++;
	if (selectCallCount === 1) return { from: mockMainFrom };
	return { from: mockSubFrom };
});

vi.mock("~/server/db", () => ({
	db: { select: mockSelect },
}));

vi.mock("~/server/db/schema", () => ({
	declarations: {
		siren: "siren",
		year: "year",
		status: "status",
		id: "id",
		compliancePath: "compliancePath",
		totalWomen: "totalWomen",
		totalMen: "totalMen",
		secondDeclarationStatus: "secondDeclarationStatus",
		secondDeclReferencePeriodStart: "secondDeclReferencePeriodStart",
		secondDeclReferencePeriodEnd: "secondDeclReferencePeriodEnd",
		createdAt: "createdAt",
		updatedAt: "updatedAt",
		declarantId: "declarantId",
	},
	companies: {
		siren: "siren",
		name: "name",
		workforce: "workforce",
		nafCode: "nafCode",
		address: "address",
		hasCse: "hasCse",
	},
	users: {
		id: "id",
		firstName: "firstName",
		lastName: "lastName",
		email: "email",
		phone: "phone",
	},
	declarationCategories: {
		siren: "siren",
		year: "year",
		step: "step",
		categoryName: "categoryName",
		womenCount: "womenCount",
		menCount: "menCount",
		womenValue: "womenValue",
		menValue: "menValue",
		womenMedianValue: "womenMedianValue",
		menMedianValue: "menMedianValue",
	},
	jobCategories: {
		id: "id",
		declarationId: "declarationId",
		name: "name",
		detail: "detail",
	},
	employeeCategories: {
		jobCategoryId: "jobCategoryId",
		declarationType: "declarationType",
		womenCount: "womenCount",
		menCount: "menCount",
		annualBaseWomen: "annualBaseWomen",
		annualBaseMen: "annualBaseMen",
		annualVariableWomen: "annualVariableWomen",
		annualVariableMen: "annualVariableMen",
		hourlyBaseWomen: "hourlyBaseWomen",
		hourlyBaseMen: "hourlyBaseMen",
		hourlyVariableWomen: "hourlyVariableWomen",
		hourlyVariableMen: "hourlyVariableMen",
	},
	cseOpinions: {
		siren: "siren",
		year: "year",
		type: "type",
		opinion: "opinion",
		opinionDate: "opinionDate",
	},
}));

vi.mock("drizzle-orm", () => ({
	and: vi.fn((...args: unknown[]) => args),
	eq: vi.fn((a: unknown, b: unknown) => [a, b]),
	gte: vi.fn((a: unknown, b: unknown) => ["gte", a, b]),
	lt: vi.fn((a: unknown, b: unknown) => ["lt", a, b]),
	sql: vi.fn(),
}));

describe("GET /api/v1/export/declarations", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		selectCallCount = 0;
		mockSubWhere.mockResolvedValue([]);
	});

	it("should return 400 when date_begin param is missing", async () => {
		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = new Request("http://localhost/api/v1/export/declarations");
		const response = await GET(request);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toContain("date_begin");
	});

	it("should return 400 when date_begin format is invalid", async () => {
		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = new Request(
			"http://localhost/api/v1/export/declarations?date_begin=2027-3-5",
		);
		const response = await GET(request);

		expect(response.status).toBe(400);
	});

	it("should return empty declarations when no match", async () => {
		mockMainWhere.mockResolvedValue([]);

		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = new Request(
			"http://localhost/api/v1/export/declarations?date_begin=2027-03-15",
		);
		const response = await GET(request);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.count).toBe(0);
		expect(body.declarations).toEqual([]);
		expect(body.dateBegin).toBe("2027-03-15");
		expect(body.dateEnd).toBe("2027-03-16");
	});

	it("should return declarations with all indicators", async () => {
		mockMainWhere.mockResolvedValue([
			{
				declarationId: "decl-1",
				siren: "123456789",
				year: 2027,
				status: "submitted",
				compliancePath: null,
				totalWomen: 100,
				totalMen: 150,
				secondDeclarationStatus: null,
				secondDeclReferencePeriodStart: null,
				secondDeclReferencePeriodEnd: null,
				createdAt: new Date("2027-03-15T10:00:00Z"),
				updatedAt: new Date("2027-03-15T12:00:00Z"),
				companyName: "ACME Corp",
				workforce: 250,
				nafCode: "62.02",
				address: "1 rue test",
				hasCse: true,
				declarantFirstName: "Jean",
				declarantLastName: "Dupont",
				declarantEmail: "jean@acme.fr",
				declarantPhone: "0612345678",
			},
		]);

		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = new Request(
			"http://localhost/api/v1/export/declarations?date_begin=2027-03-15&date_end=2027-03-20",
		);
		const response = await GET(request);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.count).toBe(1);
		expect(body.dateBegin).toBe("2027-03-15");
		expect(body.dateEnd).toBe("2027-03-20");

		const decl = body.declarations[0];
		expect(decl.siren).toBe("123456789");
		expect(decl.declarant.email).toBe("jean@acme.fr");
		expect(decl.scores).toBeUndefined();
		expect(decl.indicators).toEqual({
			A: [],
			B: [],
			C: [],
			D: [],
			E: [],
			F: [],
		});
		expect(decl.indicatorG).toBeNull();
		expect(decl.cseOpinions).toEqual([]);
		// No declarationType field
		expect(decl.declarationType).toBeUndefined();
	});
});
