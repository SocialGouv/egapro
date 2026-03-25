import { describe, expect, it, vi } from "vitest";

const mockFetchSubmitted = vi.fn().mockResolvedValue([]);
const mockFetchCategories = vi.fn().mockResolvedValue(new Map());
const mockFetchIndicatorG = vi.fn().mockResolvedValue(new Map());
const mockFetchCse = vi.fn().mockResolvedValue(new Map());

vi.mock("~/modules/export/queries", () => ({
	fetchSubmittedDeclarations: (...args: unknown[]) =>
		mockFetchSubmitted(...args),
	fetchCategoriesByDeclaration: (...args: unknown[]) =>
		mockFetchCategories(...args),
	fetchIndicatorGByDeclaration: (...args: unknown[]) =>
		mockFetchIndicatorG(...args),
	fetchCseOpinionsByDeclaration: (...args: unknown[]) => mockFetchCse(...args),
	fetchCseFilesByDeclaration: vi.fn().mockResolvedValue(new Map()),
	fetchJointEvaluationFilesByDeclaration: vi.fn().mockResolvedValue(new Map()),
}));

describe("GET /api/v1/export/declarations", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFetchSubmitted.mockResolvedValue([]);
		mockFetchCategories.mockResolvedValue(new Map());
		mockFetchIndicatorG.mockResolvedValue(new Map());
		mockFetchCse.mockResolvedValue(new Map());
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

	it("should return 400 when date_end format is invalid", async () => {
		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = new Request(
			"http://localhost/api/v1/export/declarations?date_begin=2027-03-15&date_end=bad",
		);
		const response = await GET(request);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.details).toBeDefined();
	});

	it("should return empty declarations when no match", async () => {
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
		expect(mockFetchSubmitted).toHaveBeenCalledWith("2027-03-15", "2027-03-16");
	});

	it("should use date_end when provided", async () => {
		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = new Request(
			"http://localhost/api/v1/export/declarations?date_begin=2027-03-15&date_end=2027-03-20",
		);
		const response = await GET(request);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.dateEnd).toBe("2027-03-20");
		expect(mockFetchSubmitted).toHaveBeenCalledWith("2027-03-15", "2027-03-20");
	});

	it("should return 500 when fetch throws", async () => {
		mockFetchSubmitted.mockRejectedValue(new Error("DB connection failed"));

		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = new Request(
			"http://localhost/api/v1/export/declarations?date_begin=2027-03-15",
		);
		const response = await GET(request);

		expect(response.status).toBe(500);
		const body = await response.json();
		expect(body.error).toContain("Erreur");
	});

	it("should call sub-queries with correct keys from main query results", async () => {
		mockFetchSubmitted.mockResolvedValue([
			{
				declarationId: "decl-1",
				siren: "111111111",
				year: 2027,
				status: "submitted",
				compliancePath: null,
				totalWomen: 50,
				totalMen: 50,
				secondDeclarationStatus: null,
				secondDeclReferencePeriodStart: null,
				secondDeclReferencePeriodEnd: null,
				createdAt: new Date("2027-01-01T00:00:00Z"),
				updatedAt: new Date("2027-01-01T00:00:00Z"),
				companyName: "Test",
				workforce: 100,
				nafCode: "62.01",
				address: "1 rue",
				hasCse: false,
				declarantFirstName: "A",
				declarantLastName: "B",
				declarantEmail: "a@b.fr",
				declarantPhone: "0100000000",
			},
			{
				declarationId: "decl-2",
				siren: "222222222",
				year: 2027,
				status: "submitted",
				compliancePath: null,
				totalWomen: 60,
				totalMen: 40,
				secondDeclarationStatus: null,
				secondDeclReferencePeriodStart: null,
				secondDeclReferencePeriodEnd: null,
				createdAt: new Date("2027-01-02T00:00:00Z"),
				updatedAt: new Date("2027-01-02T00:00:00Z"),
				companyName: "Test2",
				workforce: 200,
				nafCode: "62.02",
				address: "2 rue",
				hasCse: true,
				declarantFirstName: "C",
				declarantLastName: "D",
				declarantEmail: "c@d.fr",
				declarantPhone: "0200000000",
			},
		]);

		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = new Request(
			"http://localhost/api/v1/export/declarations?date_begin=2027-01-01&date_end=2027-01-03",
		);
		const response = await GET(request);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.count).toBe(2);

		expect(mockFetchCategories).toHaveBeenCalledWith([
			{ siren: "111111111", year: 2027 },
			{ siren: "222222222", year: 2027 },
		]);
		expect(mockFetchIndicatorG).toHaveBeenCalledWith(["decl-1", "decl-2"]);
		expect(mockFetchCse).toHaveBeenCalledWith([
			{ siren: "111111111", year: 2027 },
			{ siren: "222222222", year: 2027 },
		]);
	});

	it("should return assembled declarations with indicators", async () => {
		mockFetchSubmitted.mockResolvedValue([
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
			"http://localhost/api/v1/export/declarations?date_begin=2027-03-15",
		);
		const response = await GET(request);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.count).toBe(1);

		const decl = body.declarations[0];
		expect(decl.siren).toBe("123456789");
		expect(decl.declarant.email).toBe("jean@acme.fr");
		expect(decl.indicators).toEqual({
			A: [],
			B: [],
			C: [],
			D: [],
			E: [],
			F: [],
			G: null,
		});
		expect(decl.secondDeclaration.correction).toBeNull();
		expect(decl.cseOpinions).toEqual([]);
	});
});
