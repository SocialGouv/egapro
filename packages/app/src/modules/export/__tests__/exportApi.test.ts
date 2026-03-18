import { describe, expect, it, vi } from "vitest";

// Mock DB with chained query builder
const mockWhere = vi.fn();
const mockInnerJoin2 = vi.fn(() => ({ where: mockWhere }));
const mockInnerJoin1 = vi.fn(() => ({ innerJoin: mockInnerJoin2 }));
const mockFrom = vi.fn(() => ({ innerJoin: mockInnerJoin1 }));

// Mock for selectDistinct (indicator G check)
const mockJobWhere = vi.fn();
const mockJobFrom = vi.fn(() => ({ where: mockJobWhere }));
const mockSelectDistinct = vi.fn(() => ({ from: mockJobFrom }));

// Mock for CSE opinions
const mockCseWhere = vi.fn();
const mockCseFrom = vi.fn(() => ({ where: mockCseWhere }));

let selectCallCount = 0;
const mockSelect = vi.fn(() => {
	selectCallCount++;
	if (selectCallCount === 1) return { from: mockFrom };
	return { from: mockCseFrom };
});

vi.mock("~/server/db", () => ({
	db: {
		select: mockSelect,
		selectDistinct: mockSelectDistinct,
	},
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
		remunerationScore: "remunerationScore",
		variableRemunerationScore: "variableRemunerationScore",
		quartileScore: "quartileScore",
		categoryScore: "categoryScore",
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
	jobCategories: { declarationId: "declarationId" },
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
		mockWhere.mockResolvedValue([]);
		mockJobWhere.mockResolvedValue([]);
		mockCseWhere.mockResolvedValue([]);

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

	it("should return declarations with date range", async () => {
		mockWhere.mockResolvedValue([
			{
				declarationId: "decl-1",
				siren: "123456789",
				year: 2027,
				status: "submitted",
				compliancePath: null,
				totalWomen: 100,
				totalMen: 150,
				remunerationScore: 5,
				variableRemunerationScore: 3,
				quartileScore: 2,
				categoryScore: null,
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
		mockJobWhere.mockResolvedValue([]);
		mockCseWhere.mockResolvedValue([]);

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
		expect(body.declarations[0].siren).toBe("123456789");
		expect(body.declarations[0].declarationType).toBe("6_indicateurs");
		expect(body.declarations[0].declarant.email).toBe("jean@acme.fr");
		expect(body.declarations[0].scores.remuneration).toBe(5);
	});
});
