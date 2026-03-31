import { describe, expect, it, vi } from "vitest";

const mockFetchSubmitted = vi.fn().mockResolvedValue([]);
const mockFetchIndicatorG = vi.fn().mockResolvedValue(new Map());
const mockFetchCse = vi.fn().mockResolvedValue(new Map());

vi.mock("~/modules/export/queries", () => ({
	fetchSubmittedDeclarations: (...args: unknown[]) =>
		mockFetchSubmitted(...args),
	fetchIndicatorGByDeclaration: (...args: unknown[]) =>
		mockFetchIndicatorG(...args),
	fetchCseOpinionsByDeclaration: (...args: unknown[]) => mockFetchCse(...args),
}));

const VALID_AUTH_HEADER = "Bearer test-suit-api-key-that-is-at-least-32-chars";

function authedRequest(url: string): Request {
	return new Request(url, {
		headers: { Authorization: VALID_AUTH_HEADER },
	});
}

// Full indicator columns for a declaration row stub (all null)
const nullIndicators = {
	indicatorAAnnualWomen: null,
	indicatorAAnnualMen: null,
	indicatorAHourlyWomen: null,
	indicatorAHourlyMen: null,
	indicatorBAnnualWomen: null,
	indicatorBAnnualMen: null,
	indicatorBHourlyWomen: null,
	indicatorBHourlyMen: null,
	indicatorCAnnualWomen: null,
	indicatorCAnnualMen: null,
	indicatorCHourlyWomen: null,
	indicatorCHourlyMen: null,
	indicatorDAnnualWomen: null,
	indicatorDAnnualMen: null,
	indicatorDHourlyWomen: null,
	indicatorDHourlyMen: null,
	indicatorEWomen: null,
	indicatorEMen: null,
	indicatorFAnnualThreshold1: null,
	indicatorFAnnualWomen1: null,
	indicatorFAnnualMen1: null,
	indicatorFAnnualThreshold2: null,
	indicatorFAnnualWomen2: null,
	indicatorFAnnualMen2: null,
	indicatorFAnnualThreshold3: null,
	indicatorFAnnualWomen3: null,
	indicatorFAnnualMen3: null,
	indicatorFAnnualThreshold4: null,
	indicatorFAnnualWomen4: null,
	indicatorFAnnualMen4: null,
	indicatorFHourlyThreshold1: null,
	indicatorFHourlyWomen1: null,
	indicatorFHourlyMen1: null,
	indicatorFHourlyThreshold2: null,
	indicatorFHourlyWomen2: null,
	indicatorFHourlyMen2: null,
	indicatorFHourlyThreshold3: null,
	indicatorFHourlyWomen3: null,
	indicatorFHourlyMen3: null,
	indicatorFHourlyThreshold4: null,
	indicatorFHourlyWomen4: null,
	indicatorFHourlyMen4: null,
};

describe("GET /api/v1/export/declarations", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFetchSubmitted.mockResolvedValue([]);
		mockFetchIndicatorG.mockResolvedValue(new Map());
		mockFetchCse.mockResolvedValue(new Map());
	});

	it("should return 401 when Authorization header is missing", async () => {
		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = new Request("http://localhost/api/v1/export/declarations");
		const response = await GET(request);

		expect(response.status).toBe(401);
	});

	it("should return 401 when API key is invalid", async () => {
		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = new Request(
			"http://localhost/api/v1/export/declarations?date_begin=2027-03-15",
			{ headers: { Authorization: "Bearer wrong-key" } },
		);
		const response = await GET(request);

		expect(response.status).toBe(401);
	});

	it("should return 400 when date_begin param is missing", async () => {
		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = authedRequest(
			"http://localhost/api/v1/export/declarations",
		);
		const response = await GET(request);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toContain("date_begin");
	});

	it("should return 400 when date_begin format is invalid", async () => {
		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = authedRequest(
			"http://localhost/api/v1/export/declarations?date_begin=2027-3-5",
		);
		const response = await GET(request);

		expect(response.status).toBe(400);
	});

	it("should return 400 when date_end format is invalid", async () => {
		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = authedRequest(
			"http://localhost/api/v1/export/declarations?date_begin=2027-03-15&date_end=bad",
		);
		const response = await GET(request);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.details).toBeDefined();
	});

	it("should return empty declarations when no match", async () => {
		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = authedRequest(
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
		const request = authedRequest(
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
		const request = authedRequest(
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
				...nullIndicators,
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
				...nullIndicators,
			},
		]);

		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = authedRequest(
			"http://localhost/api/v1/export/declarations?date_begin=2027-01-01&date_end=2027-01-03",
		);
		const response = await GET(request);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.count).toBe(2);

		expect(mockFetchIndicatorG).toHaveBeenCalledWith(["decl-1", "decl-2"]);
		expect(mockFetchCse).toHaveBeenCalledWith(["decl-1", "decl-2"]);
	});

	it("should return assembled declarations with flat indicator columns", async () => {
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
				// Populate a few indicator values
				indicatorAAnnualWomen: "35000",
				indicatorAAnnualMen: "38000",
				...Object.fromEntries(
					Object.entries(nullIndicators).filter(
						([k]) =>
							k !== "indicatorAAnnualWomen" && k !== "indicatorAAnnualMen",
					),
				),
			},
		]);

		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = authedRequest(
			"http://localhost/api/v1/export/declarations?date_begin=2027-03-15",
		);
		const response = await GET(request);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.count).toBe(1);

		const decl = body.declarations[0];
		expect(decl.siren).toBe("123456789");
		expect(decl.declarant.email).toBe("jean@acme.fr");
		expect(decl.indicators.A.annualWomen).toBe("35000");
		expect(decl.indicators.A.annualMen).toBe("38000");
		expect(decl.indicators.A.hourlyWomen).toBeNull();
		expect(decl.indicators.G).toBeNull();
		expect(decl.indicators.F.annual).toHaveLength(4);
		expect(decl.secondDeclaration.correction).toBeNull();
		expect(decl.cseOpinions).toEqual([]);
	});
});
