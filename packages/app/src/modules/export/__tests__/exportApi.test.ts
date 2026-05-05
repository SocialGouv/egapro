import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetchSubmitted = vi.fn().mockResolvedValue([]);
const mockFetchIndicatorG = vi.fn().mockResolvedValue(new Map());
const mockFetchCse = vi.fn().mockResolvedValue(new Map());
const mockFetchCseFiles = vi.fn().mockResolvedValue(new Map());
const mockFetchJointEval = vi.fn().mockResolvedValue(new Map());

vi.mock("~/modules/export/queries", () => ({
	fetchSubmittedDeclarations: (...args: unknown[]) =>
		mockFetchSubmitted(...args),
	fetchIndicatorGByDeclaration: (...args: unknown[]) =>
		mockFetchIndicatorG(...args),
	fetchCseOpinionsByDeclaration: (...args: unknown[]) => mockFetchCse(...args),
	fetchCseFilesByDeclaration: (...args: unknown[]) =>
		mockFetchCseFiles(...args),
	fetchJointEvaluationFilesByDeclaration: (...args: unknown[]) =>
		mockFetchJointEval(...args),
}));

/**
 * APISIX-forwarded requests carry `X-Gateway-Forwarded` (injected by the
 * gateway's `proxy-rewrite` plugin). Bearer + rate-limit are enforced by
 * APISIX upstream, so tests only need to simulate the header presence that
 * the middleware has already validated. See `filesApi.test.ts` for the same
 * pattern.
 */
function gatewayForwardedRequest(url: string): Request {
	return new Request(url, {
		headers: { "x-gateway-forwarded": "test-gateway-secret" },
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
	indicatorFHourlyWomen4: null,
	indicatorFHourlyMen4: null,
};

describe("GET /api/v1/export/declarations", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFetchSubmitted.mockResolvedValue([]);
		mockFetchIndicatorG.mockResolvedValue(new Map());
		mockFetchCse.mockResolvedValue(new Map());
		mockFetchCseFiles.mockResolvedValue(new Map());
		mockFetchJointEval.mockResolvedValue(new Map());
	});

	it("should return 403 when X-Gateway-Forwarded header is missing", async () => {
		// Bearer validation now lives in APISIX; the route only enforces the
		// anti-bypass header (see gatewaySource.ts). A direct cluster-internal
		// call that skips APISIX arrives with no header and is rejected here.
		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = new Request("http://localhost/api/v1/export/declarations");
		const response = await GET(request);

		expect(response.status).toBe(403);
	});

	it("should return 400 when date_begin param is missing", async () => {
		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = gatewayForwardedRequest(
			"http://localhost/api/v1/export/declarations",
		);
		const response = await GET(request);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.error).toContain("date_begin");
	});

	it("should return 400 when date_begin format is invalid", async () => {
		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = gatewayForwardedRequest(
			"http://localhost/api/v1/export/declarations?date_begin=2027-3-5",
		);
		const response = await GET(request);

		expect(response.status).toBe(400);
	});

	it("should return 400 when date_end format is invalid", async () => {
		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = gatewayForwardedRequest(
			"http://localhost/api/v1/export/declarations?date_begin=2027-03-15&date_end=bad",
		);
		const response = await GET(request);

		expect(response.status).toBe(400);
		const body = await response.json();
		expect(body.details).toBeDefined();
	});

	it("should return empty declarations when no match", async () => {
		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = gatewayForwardedRequest(
			"http://localhost/api/v1/export/declarations?date_begin=2027-03-15",
		);
		const response = await GET(request);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.Nombre).toBe(0);
		expect(body.Declarations).toEqual([]);
		expect(body.Date_debut).toBe("2027-03-15");
		expect(body.Date_fin).toBe("2027-03-16");
		expect(mockFetchSubmitted).toHaveBeenCalledWith("2027-03-15", "2027-03-16");
	});

	it("should use date_end when provided", async () => {
		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = gatewayForwardedRequest(
			"http://localhost/api/v1/export/declarations?date_begin=2027-03-15&date_end=2027-03-20",
		);
		const response = await GET(request);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.Date_fin).toBe("2027-03-20");
		expect(mockFetchSubmitted).toHaveBeenCalledWith("2027-03-15", "2027-03-20");
	});

	it("should return 500 when fetch throws", async () => {
		mockFetchSubmitted.mockRejectedValue(new Error("DB connection failed"));

		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = gatewayForwardedRequest(
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
		const request = gatewayForwardedRequest(
			"http://localhost/api/v1/export/declarations?date_begin=2027-01-01&date_end=2027-01-03",
		);
		const response = await GET(request);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.Nombre).toBe(2);

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
		const request = gatewayForwardedRequest(
			"http://localhost/api/v1/export/declarations?date_begin=2027-03-15",
		);
		const response = await GET(request);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.Nombre).toBe(1);

		const decl = body.Declarations[0];
		expect(decl.SIREN).toBe("123456789");
		expect(decl.Declarant.Email).toBe("jean@acme.fr");
		expect(decl.Indicateurs.A.Rem_globale_annuelle_moyenne_F).toBe("35000");
		expect(decl.Indicateurs.A.Rem_globale_annuelle_moyenne_H).toBe("38000");
		expect(decl.Indicateurs.A.Taux_horaire_global_moyen_F).toBeNull();
		expect(decl.Indicateurs.G).toBeNull();
		expect(decl.Indicateurs.F.annuel.Seuil_Q1_Rem_globale).toBeNull();
		expect(decl.Seconde_declaration.Correction).toBeNull();
		expect(decl).not.toHaveProperty("Avis_CSE");
		expect(decl).not.toHaveProperty("Fichiers_CSE");
		expect(decl).not.toHaveProperty("Fichier_evaluation_conjointe");
	});

	it("should expose CSE opinion declarationNumber alongside type", async () => {
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
				...nullIndicators,
			},
		]);
		mockFetchCse.mockResolvedValue(
			new Map([
				[
					"decl-1",
					[
						{
							declarationNumber: 1,
							type: "accuracy",
							opinion: "favorable",
							opinionDate: "2027-03-01",
						},
						{
							declarationNumber: 2,
							type: "gap",
							opinion: "unfavorable",
							opinionDate: "2027-06-01",
						},
					],
				],
			]),
		);
		mockFetchCseFiles.mockResolvedValue(
			new Map([
				[
					"123456789-2027",
					[
						{
							id: "file-abc",
							siren: "123456789",
							year: 2027,
							fileName: "avis.pdf",
							filePath: "/s3/path",
							uploadedAt: new Date("2027-03-10T08:30:00Z"),
						},
					],
				],
			]),
		);

		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = gatewayForwardedRequest(
			"http://localhost/api/v1/export/declarations?date_begin=2027-03-15",
		);
		const response = await GET(request);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.Declarations[0].Avis_CSE).toEqual([
			{
				Numero_declaration: 1,
				Type: "accuracy",
				Avis: "favorable",
				Date: "2027-03-01",
			},
			{
				Numero_declaration: 2,
				Type: "gap",
				Avis: "unfavorable",
				Date: "2027-06-01",
			},
		]);
	});

	it("should include CSE file URLs in the declaration response", async () => {
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
				...nullIndicators,
			},
		]);
		mockFetchCseFiles.mockResolvedValue(
			new Map([
				[
					"123456789-2027",
					[
						{
							id: "file-abc",
							siren: "123456789",
							year: 2027,
							fileName: "avis-cse-2027.pdf",
							filePath: "/s3/path",
							uploadedAt: new Date("2027-03-10T08:30:00Z"),
						},
					],
				],
			]),
		);

		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = gatewayForwardedRequest(
			"http://localhost/api/v1/export/declarations?date_begin=2027-03-15",
		);
		const response = await GET(request);

		expect(response.status).toBe(200);
		expect(mockFetchCseFiles).toHaveBeenCalledWith([
			{ siren: "123456789", year: 2027 },
		]);
		const body = await response.json();
		expect(body.Declarations[0].Fichiers_CSE).toEqual([
			{
				Id: "file-abc",
				Type: "cse_opinion",
				Nom_fichier: "avis-cse-2027.pdf",
				Date_upload: "2027-03-10T08:30:00.000Z",
				URL_telechargement: "/api/v1/files/file-abc",
			},
		]);
	});

	it("should omit cseOpinions / cseFiles when no CSE file is attached", async () => {
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
				...nullIndicators,
			},
		]);
		mockFetchCse.mockResolvedValue(
			new Map([
				[
					"decl-1",
					[
						{
							declarationNumber: 1,
							type: "accuracy",
							opinion: "favorable",
							opinionDate: "2027-03-01",
						},
					],
				],
			]),
		);

		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = gatewayForwardedRequest(
			"http://localhost/api/v1/export/declarations?date_begin=2027-03-15",
		);
		const response = await GET(request);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.Declarations[0]).not.toHaveProperty("Avis_CSE");
		expect(body.Declarations[0]).not.toHaveProperty("Fichiers_CSE");
	});

	it("should include jointEvaluationFile with explicit name when uploaded", async () => {
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
				...nullIndicators,
			},
		]);
		mockFetchJointEval.mockResolvedValue(
			new Map([
				[
					"123456789-2027",
					[
						{
							id: "je-1",
							siren: "123456789",
							year: 2027,
							fileName: "eval.pdf",
							filePath: "/s3/je",
							uploadedAt: new Date("2027-04-01T09:00:00Z"),
						},
					],
				],
			]),
		);

		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = gatewayForwardedRequest(
			"http://localhost/api/v1/export/declarations?date_begin=2027-03-15",
		);
		const response = await GET(request);

		expect(response.status).toBe(200);
		expect(mockFetchJointEval).toHaveBeenCalledWith([
			{ siren: "123456789", year: 2027 },
		]);
		const body = await response.json();
		expect(body.Declarations[0].Fichier_evaluation_conjointe).toEqual({
			Id: "je-1",
			Type: "joint_evaluation",
			Nom_fichier: "eval.pdf",
			Date_upload: "2027-04-01T09:00:00.000Z",
			URL_telechargement: "/api/v1/files/je-1",
		});
	});
});
