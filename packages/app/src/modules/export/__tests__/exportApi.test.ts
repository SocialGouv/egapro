import { beforeEach, describe, expect, it, vi } from "vitest";

import {
	GAP_PERSISTS_CONDITION,
	GAP_RESOLVED_CONDITION,
	STAGE_LABELS,
} from "./helpers/nextStepLabels";
import { RELOCATED_ROOT_KEYS } from "./helpers/parcoursKeys";

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
	globalAnnualMeanGap: null,
	globalHourlyMeanGap: null,
	variableAnnualMeanGap: null,
	variableHourlyMeanGap: null,
	globalAnnualMedianGap: null,
	globalHourlyMedianGap: null,
	variableAnnualMedianGap: null,
	variableHourlyMedianGap: null,
	variableProportionWomen: null,
	variableProportionMen: null,
	annualQuartile1ProportionWomen: null,
	annualQuartile2ProportionWomen: null,
	annualQuartile3ProportionWomen: null,
	annualQuartile4ProportionWomen: null,
	annualQuartile1ProportionMen: null,
	annualQuartile2ProportionMen: null,
	annualQuartile3ProportionMen: null,
	annualQuartile4ProportionMen: null,
	hourlyQuartile1ProportionWomen: null,
	hourlyQuartile2ProportionWomen: null,
	hourlyQuartile3ProportionWomen: null,
	hourlyQuartile4ProportionWomen: null,
	hourlyQuartile1ProportionMen: null,
	hourlyQuartile2ProportionMen: null,
	hourlyQuartile3ProportionMen: null,
	hourlyQuartile4ProportionMen: null,
	statusHistoryArray: [] as Array<{
		eventType: string;
		value: string | null;
		round: number | null;
		createdAt: string;
	}>,
};

// These cases differ from the fixtures above by a handful of columns only,
// so they go through a factory and spell out just what they exercise.
function declarationRow(overrides: Record<string, unknown> = {}) {
	return {
		declarationId: "decl-1",
		siren: "123456789",
		year: 2027,
		status: "awaiting_compliance_path_choice",
		firstDeclarationPathChoice: null,
		secondDeclarationPathChoice: null,
		totalWomen: 100,
		totalMen: 150,
		submittedAt: null,
		firstDeclarationPathChoiceAt: null,
		secondDeclarationPathChoiceAt: null,
		secondDeclarationSubmittedAt: null,
		jointEvaluationSubmittedAt: null,
		cseOpinionCompletedAt: null,
		demarcheCompletedAt: null,
		complianceProcessRequired: false,
		complianceProcessRevisionRequired: false,
		cseRequired: true,
		indicatorGRequired: false,
		rulesVersion: "2027.1",
		secondDeclReferencePeriodStart: null,
		secondDeclReferencePeriodEnd: null,
		createdAt: new Date("2027-03-15T10:00:00Z"),
		updatedAt: new Date("2027-03-15T12:00:00Z"),
		cancelledAt: null,
		companyName: "ACME Corp",
		workforceEma: "250.00",
		nafCode: "62.02",
		address: "1 rue test",
		hasCse: true,
		declarantFirstName: "Jean",
		declarantLastName: "Dupont",
		declarantEmail: "jean@acme.fr",
		declarantPhone: "0612345678",
		...nullIndicators,
		...overrides,
	};
}

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
				status: "awaiting_compliance_path_choice",
				firstDeclarationPathChoice: null,
				secondDeclarationPathChoice: null,
				totalWomen: 50,
				totalMen: 50,
				submittedAt: null,
				firstDeclarationPathChoiceAt: null,
				secondDeclarationPathChoiceAt: null,
				secondDeclarationSubmittedAt: null,
				jointEvaluationSubmittedAt: null,
				cseOpinionCompletedAt: null,
				demarcheCompletedAt: null,
				complianceProcessRequired: false,
				complianceProcessRevisionRequired: false,
				cseRequired: false,
				indicatorGRequired: false,
				rulesVersion: "2027.1",
				secondDeclReferencePeriodStart: null,
				secondDeclReferencePeriodEnd: null,
				createdAt: new Date("2027-01-01T00:00:00Z"),
				updatedAt: new Date("2027-01-01T00:00:00Z"),
				cancelledAt: null,
				companyName: "Test",
				workforceEma: "100.00",
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
				status: "awaiting_compliance_path_choice",
				firstDeclarationPathChoice: null,
				secondDeclarationPathChoice: null,
				totalWomen: 60,
				totalMen: 40,
				submittedAt: null,
				firstDeclarationPathChoiceAt: null,
				secondDeclarationPathChoiceAt: null,
				secondDeclarationSubmittedAt: null,
				jointEvaluationSubmittedAt: null,
				cseOpinionCompletedAt: null,
				demarcheCompletedAt: null,
				complianceProcessRequired: false,
				complianceProcessRevisionRequired: false,
				cseRequired: false,
				indicatorGRequired: false,
				rulesVersion: "2027.1",
				secondDeclReferencePeriodStart: null,
				secondDeclReferencePeriodEnd: null,
				createdAt: new Date("2027-01-02T00:00:00Z"),
				updatedAt: new Date("2027-01-02T00:00:00Z"),
				cancelledAt: null,
				companyName: "Test2",
				workforceEma: "200.00",
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
				status: "awaiting_compliance_path_choice",
				firstDeclarationPathChoice: null,
				secondDeclarationPathChoice: null,
				totalWomen: 100,
				totalMen: 150,
				submittedAt: null,
				firstDeclarationPathChoiceAt: null,
				secondDeclarationPathChoiceAt: null,
				secondDeclarationSubmittedAt: null,
				jointEvaluationSubmittedAt: null,
				cseOpinionCompletedAt: null,
				demarcheCompletedAt: null,
				complianceProcessRequired: false,
				complianceProcessRevisionRequired: false,
				cseRequired: false,
				indicatorGRequired: false,
				rulesVersion: "2027.1",
				secondDeclReferencePeriodStart: null,
				secondDeclReferencePeriodEnd: null,
				createdAt: new Date("2027-03-15T10:00:00Z"),
				updatedAt: new Date("2027-03-15T12:00:00Z"),
				cancelledAt: null,
				companyName: "ACME Corp",
				workforceEma: "250.00",
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

	it("should send the GIP annual average workforce as Effectif, not the Weez value (#3929)", async () => {
		mockFetchSubmitted.mockResolvedValue([
			{
				declarationId: "decl-1",
				siren: "432491777",
				year: 2027,
				status: "awaiting_compliance_path_choice",
				firstDeclarationPathChoice: null,
				secondDeclarationPathChoice: null,
				totalWomen: 30,
				totalMen: 40,
				submittedAt: null,
				firstDeclarationPathChoiceAt: null,
				secondDeclarationPathChoiceAt: null,
				secondDeclarationSubmittedAt: null,
				jointEvaluationSubmittedAt: null,
				cseOpinionCompletedAt: null,
				demarcheCompletedAt: null,
				complianceProcessRequired: false,
				complianceProcessRevisionRequired: false,
				cseRequired: false,
				indicatorGRequired: false,
				rulesVersion: "2027.1",
				secondDeclReferencePeriodStart: null,
				secondDeclReferencePeriodEnd: null,
				createdAt: new Date("2027-03-15T10:00:00Z"),
				updatedAt: new Date("2027-03-15T12:00:00Z"),
				cancelledAt: null,
				companyName: "ACME Corp",
				workforceEma: "70.00",
				nafCode: "62.02",
				address: "1 rue test",
				hasCse: null,
				declarantFirstName: "Jean",
				declarantLastName: "Dupont",
				declarantEmail: "jean@acme.fr",
				declarantPhone: "0612345678",
				...nullIndicators,
			},
		]);

		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = gatewayForwardedRequest(
			"http://localhost/api/v1/export/declarations?date_begin=2027-03-15",
		);
		const response = await GET(request);

		expect(response.status).toBe(200);
		const decl = (await response.json()).Declarations[0];
		expect(decl.Parcours.Effectif).toBe(70);
		expect(decl.Parcours.Indicateur_G_requis).toBe(false);
	});

	it("should send a null Effectif when the company is absent from the GIP file", async () => {
		mockFetchSubmitted.mockResolvedValue([
			{
				declarationId: "decl-1",
				siren: "999999999",
				year: 2027,
				status: "awaiting_compliance_path_choice",
				firstDeclarationPathChoice: null,
				secondDeclarationPathChoice: null,
				totalWomen: 10,
				totalMen: 10,
				submittedAt: null,
				firstDeclarationPathChoiceAt: null,
				secondDeclarationPathChoiceAt: null,
				secondDeclarationSubmittedAt: null,
				jointEvaluationSubmittedAt: null,
				cseOpinionCompletedAt: null,
				demarcheCompletedAt: null,
				complianceProcessRequired: false,
				complianceProcessRevisionRequired: false,
				cseRequired: false,
				indicatorGRequired: false,
				rulesVersion: "2027.1",
				secondDeclReferencePeriodStart: null,
				secondDeclReferencePeriodEnd: null,
				createdAt: new Date("2027-03-15T10:00:00Z"),
				updatedAt: new Date("2027-03-15T12:00:00Z"),
				cancelledAt: null,
				companyName: "Hors GIP",
				workforceEma: null,
				nafCode: "62.02",
				address: "1 rue test",
				hasCse: null,
				declarantFirstName: "Jean",
				declarantLastName: "Dupont",
				declarantEmail: "jean@acme.fr",
				declarantPhone: "0612345678",
				...nullIndicators,
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
		expect(body.Declarations[0].Parcours.Effectif).toBeNull();
		// Workforce-0 (absent from GIP) is in the voluntary (< 50) tier → 7-indicator
		// volunteering, so indicator G is required (#4043).
		expect(body.Declarations[0].Parcours.Indicateur_G_requis).toBe(true);
	});

	it("should expose CSE opinion declarationNumber alongside type", async () => {
		mockFetchSubmitted.mockResolvedValue([
			{
				declarationId: "decl-1",
				siren: "123456789",
				year: 2027,
				status: "awaiting_compliance_path_choice",
				firstDeclarationPathChoice: null,
				secondDeclarationPathChoice: null,
				totalWomen: 100,
				totalMen: 150,
				submittedAt: null,
				firstDeclarationPathChoiceAt: null,
				secondDeclarationPathChoiceAt: null,
				secondDeclarationSubmittedAt: null,
				jointEvaluationSubmittedAt: null,
				cseOpinionCompletedAt: null,
				demarcheCompletedAt: null,
				complianceProcessRequired: false,
				complianceProcessRevisionRequired: false,
				cseRequired: false,
				indicatorGRequired: false,
				rulesVersion: "2027.1",
				secondDeclReferencePeriodStart: null,
				secondDeclReferencePeriodEnd: null,
				createdAt: new Date("2027-03-15T10:00:00Z"),
				updatedAt: new Date("2027-03-15T12:00:00Z"),
				cancelledAt: null,
				companyName: "ACME Corp",
				workforceEma: "250.00",
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
				status: "awaiting_compliance_path_choice",
				firstDeclarationPathChoice: null,
				secondDeclarationPathChoice: null,
				totalWomen: 100,
				totalMen: 150,
				submittedAt: null,
				firstDeclarationPathChoiceAt: null,
				secondDeclarationPathChoiceAt: null,
				secondDeclarationSubmittedAt: null,
				jointEvaluationSubmittedAt: null,
				cseOpinionCompletedAt: null,
				demarcheCompletedAt: null,
				complianceProcessRequired: false,
				complianceProcessRevisionRequired: false,
				cseRequired: false,
				indicatorGRequired: false,
				rulesVersion: "2027.1",
				secondDeclReferencePeriodStart: null,
				secondDeclReferencePeriodEnd: null,
				createdAt: new Date("2027-03-15T10:00:00Z"),
				updatedAt: new Date("2027-03-15T12:00:00Z"),
				cancelledAt: null,
				companyName: "ACME Corp",
				workforceEma: "250.00",
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
				status: "awaiting_compliance_path_choice",
				firstDeclarationPathChoice: null,
				secondDeclarationPathChoice: null,
				totalWomen: 100,
				totalMen: 150,
				submittedAt: null,
				firstDeclarationPathChoiceAt: null,
				secondDeclarationPathChoiceAt: null,
				secondDeclarationSubmittedAt: null,
				jointEvaluationSubmittedAt: null,
				cseOpinionCompletedAt: null,
				demarcheCompletedAt: null,
				complianceProcessRequired: false,
				complianceProcessRevisionRequired: false,
				cseRequired: false,
				indicatorGRequired: false,
				rulesVersion: "2027.1",
				secondDeclReferencePeriodStart: null,
				secondDeclReferencePeriodEnd: null,
				createdAt: new Date("2027-03-15T10:00:00Z"),
				updatedAt: new Date("2027-03-15T12:00:00Z"),
				cancelledAt: null,
				companyName: "ACME Corp",
				workforceEma: "250.00",
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
				status: "awaiting_compliance_path_choice",
				firstDeclarationPathChoice: null,
				secondDeclarationPathChoice: null,
				totalWomen: 100,
				totalMen: 150,
				submittedAt: null,
				firstDeclarationPathChoiceAt: null,
				secondDeclarationPathChoiceAt: null,
				secondDeclarationSubmittedAt: null,
				jointEvaluationSubmittedAt: null,
				cseOpinionCompletedAt: null,
				demarcheCompletedAt: null,
				complianceProcessRequired: false,
				complianceProcessRevisionRequired: false,
				cseRequired: false,
				indicatorGRequired: false,
				rulesVersion: "2027.1",
				secondDeclReferencePeriodStart: null,
				secondDeclReferencePeriodEnd: null,
				createdAt: new Date("2027-03-15T10:00:00Z"),
				updatedAt: new Date("2027-03-15T12:00:00Z"),
				cancelledAt: null,
				companyName: "ACME Corp",
				workforceEma: "250.00",
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

	it("should expose gap and proportion labels with verbatim CSV names when DB columns are populated (S2)", async () => {
		mockFetchSubmitted.mockResolvedValue([
			{
				declarationId: "decl-1",
				siren: "123456789",
				year: 2027,
				status: "awaiting_compliance_path_choice",
				firstDeclarationPathChoice: null,
				secondDeclarationPathChoice: null,
				totalWomen: 100,
				totalMen: 150,
				submittedAt: null,
				firstDeclarationPathChoiceAt: null,
				secondDeclarationPathChoiceAt: null,
				secondDeclarationSubmittedAt: null,
				jointEvaluationSubmittedAt: null,
				cseOpinionCompletedAt: null,
				demarcheCompletedAt: null,
				complianceProcessRequired: false,
				complianceProcessRevisionRequired: false,
				cseRequired: false,
				indicatorGRequired: false,
				rulesVersion: "2027.1",
				secondDeclReferencePeriodStart: null,
				secondDeclReferencePeriodEnd: null,
				createdAt: new Date("2027-03-15T10:00:00Z"),
				updatedAt: new Date("2027-03-15T12:00:00Z"),
				cancelledAt: null,
				companyName: "ACME Corp",
				workforceEma: "250.00",
				nafCode: "62.02",
				address: "1 rue test",
				hasCse: false,
				declarantFirstName: "Jean",
				declarantLastName: "Dupont",
				declarantEmail: "jean@acme.fr",
				declarantPhone: "0612345678",
				...nullIndicators,
				globalAnnualMeanGap: "0.0455",
				variableProportionWomen: "0.5625",
				annualQuartile1ProportionWomen: "0.3333",
			},
		]);

		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = gatewayForwardedRequest(
			"http://localhost/api/v1/export/declarations?date_begin=2027-03-15",
		);
		const response = await GET(request);

		expect(response.status).toBe(200);
		const body = await response.json();
		const decl = body.Declarations[0];
		expect(decl.Indicateurs.A.Rem_globale_annuelle_moyenne_ecart).toBe(
			"0.0455",
		);
		expect(decl.Indicateurs.E.Proportion_variable_F).toBe("0.5625");
		expect(
			decl.Indicateurs.F.annuel.Quartile1_Rem_globale_annuelle_proportion_F,
		).toBe("0.3333");
	});

	it("should return null for all 10 new labels when DB columns are null (S5 — historical declaration)", async () => {
		mockFetchSubmitted.mockResolvedValue([
			{
				declarationId: "decl-1",
				siren: "123456789",
				year: 2027,
				status: "awaiting_compliance_path_choice",
				firstDeclarationPathChoice: null,
				secondDeclarationPathChoice: null,
				totalWomen: 100,
				totalMen: 150,
				submittedAt: null,
				firstDeclarationPathChoiceAt: null,
				secondDeclarationPathChoiceAt: null,
				secondDeclarationSubmittedAt: null,
				jointEvaluationSubmittedAt: null,
				cseOpinionCompletedAt: null,
				demarcheCompletedAt: null,
				complianceProcessRequired: false,
				complianceProcessRevisionRequired: false,
				cseRequired: false,
				indicatorGRequired: false,
				rulesVersion: "2027.1",
				secondDeclReferencePeriodStart: null,
				secondDeclReferencePeriodEnd: null,
				createdAt: new Date("2027-03-15T10:00:00Z"),
				updatedAt: new Date("2027-03-15T12:00:00Z"),
				cancelledAt: null,
				companyName: "ACME Corp",
				workforceEma: "250.00",
				nafCode: "62.02",
				address: "1 rue test",
				hasCse: false,
				declarantFirstName: "Jean",
				declarantLastName: "Dupont",
				declarantEmail: "jean@acme.fr",
				declarantPhone: "0612345678",
				...nullIndicators,
			},
		]);

		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = gatewayForwardedRequest(
			"http://localhost/api/v1/export/declarations?date_begin=2027-03-15",
		);
		const response = await GET(request);

		expect(response.status).toBe(200);
		const body = await response.json();
		const decl = body.Declarations[0];
		expect(decl.Indicateurs.A.Rem_globale_annuelle_moyenne_ecart).toBeNull();
		expect(decl.Indicateurs.A.Taux_horaire_global_moyen_ecart).toBeNull();
		expect(decl.Indicateurs.B.Rem_variable_annuelle_moyenne_ecart).toBeNull();
		expect(decl.Indicateurs.B.Taux_horaire_variable_moyen_ecart).toBeNull();
		expect(decl.Indicateurs.C.Rem_globale_annuelle_médiane_ecart).toBeNull();
		expect(decl.Indicateurs.C.Taux_horaire_global_médian_ecart).toBeNull();
		expect(decl.Indicateurs.D.Rem_variable_annuelle_médiane_ecart).toBeNull();
		expect(decl.Indicateurs.D.Taux_horaire_variable_médian_ecart).toBeNull();
		expect(decl.Indicateurs.E.Proportion_variable_F).toBeNull();
		expect(decl.Indicateurs.E.Proportion_variable_H).toBeNull();
		expect(
			decl.Indicateurs.F.annuel.Quartile1_Rem_globale_annuelle_proportion_F,
		).toBeNull();
		expect(
			decl.Indicateurs.F.horaire.Quartile1_Taux_horaire_global_proportion_F,
		).toBeNull();
		expect(decl.Indicateurs.A.Rem_globale_annuelle_moyenne_F).toBeNull();
	});

	it("should expose some gap values and null others when only some DB columns are populated (S4 — mixed)", async () => {
		mockFetchSubmitted.mockResolvedValue([
			{
				declarationId: "decl-1",
				siren: "123456789",
				year: 2027,
				status: "awaiting_compliance_path_choice",
				firstDeclarationPathChoice: null,
				secondDeclarationPathChoice: null,
				totalWomen: 100,
				totalMen: 150,
				submittedAt: null,
				firstDeclarationPathChoiceAt: null,
				secondDeclarationPathChoiceAt: null,
				secondDeclarationSubmittedAt: null,
				jointEvaluationSubmittedAt: null,
				cseOpinionCompletedAt: null,
				demarcheCompletedAt: null,
				complianceProcessRequired: false,
				complianceProcessRevisionRequired: false,
				cseRequired: false,
				indicatorGRequired: false,
				rulesVersion: "2027.1",
				secondDeclReferencePeriodStart: null,
				secondDeclReferencePeriodEnd: null,
				createdAt: new Date("2027-03-15T10:00:00Z"),
				updatedAt: new Date("2027-03-15T12:00:00Z"),
				cancelledAt: null,
				companyName: "ACME Corp",
				workforceEma: "250.00",
				nafCode: "62.02",
				address: "1 rue test",
				hasCse: false,
				declarantFirstName: "Jean",
				declarantLastName: "Dupont",
				declarantEmail: "jean@acme.fr",
				declarantPhone: "0612345678",
				...nullIndicators,
				globalAnnualMeanGap: "0.0455",
				variableProportionWomen: null,
			},
		]);

		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = gatewayForwardedRequest(
			"http://localhost/api/v1/export/declarations?date_begin=2027-03-15",
		);
		const response = await GET(request);

		expect(response.status).toBe(200);
		const body = await response.json();
		const decl = body.Declarations[0];
		expect(decl.Indicateurs.A.Rem_globale_annuelle_moyenne_ecart).toBe(
			"0.0455",
		);
		expect(decl.Indicateurs.E.Proportion_variable_F).toBeNull();
	});

	it("should use verbatim CSV label names for all 10 new gap and proportion keys", async () => {
		mockFetchSubmitted.mockResolvedValue([
			{
				declarationId: "decl-1",
				siren: "123456789",
				year: 2027,
				status: "awaiting_compliance_path_choice",
				firstDeclarationPathChoice: null,
				secondDeclarationPathChoice: null,
				totalWomen: 100,
				totalMen: 150,
				submittedAt: null,
				firstDeclarationPathChoiceAt: null,
				secondDeclarationPathChoiceAt: null,
				secondDeclarationSubmittedAt: null,
				jointEvaluationSubmittedAt: null,
				cseOpinionCompletedAt: null,
				demarcheCompletedAt: null,
				complianceProcessRequired: false,
				complianceProcessRevisionRequired: false,
				cseRequired: false,
				indicatorGRequired: false,
				rulesVersion: "2027.1",
				secondDeclReferencePeriodStart: null,
				secondDeclReferencePeriodEnd: null,
				createdAt: new Date("2027-03-15T10:00:00Z"),
				updatedAt: new Date("2027-03-15T12:00:00Z"),
				cancelledAt: null,
				companyName: "ACME Corp",
				workforceEma: "250.00",
				nafCode: "62.02",
				address: "1 rue test",
				hasCse: false,
				declarantFirstName: "Jean",
				declarantLastName: "Dupont",
				declarantEmail: "jean@acme.fr",
				declarantPhone: "0612345678",
				...nullIndicators,
			},
		]);

		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = gatewayForwardedRequest(
			"http://localhost/api/v1/export/declarations?date_begin=2027-03-15",
		);
		const response = await GET(request);

		expect(response.status).toBe(200);
		const body = await response.json();
		const decl = body.Declarations[0];

		const expectedKeys = [
			"Rem_globale_annuelle_moyenne_ecart",
			"Taux_horaire_global_moyen_ecart",
			"Rem_variable_annuelle_moyenne_ecart",
			"Taux_horaire_variable_moyen_ecart",
			"Rem_globale_annuelle_médiane_ecart",
			"Taux_horaire_global_médian_ecart",
			"Rem_variable_annuelle_médiane_ecart",
			"Taux_horaire_variable_médian_ecart",
			"Proportion_variable_F",
			"Proportion_variable_H",
		];

		expect(Object.keys(decl.Indicateurs.A)).toContain(
			"Rem_globale_annuelle_moyenne_ecart",
		);
		expect(Object.keys(decl.Indicateurs.A)).toContain(
			"Taux_horaire_global_moyen_ecart",
		);
		expect(Object.keys(decl.Indicateurs.B)).toContain(
			"Rem_variable_annuelle_moyenne_ecart",
		);
		expect(Object.keys(decl.Indicateurs.B)).toContain(
			"Taux_horaire_variable_moyen_ecart",
		);
		expect(Object.keys(decl.Indicateurs.C)).toContain(
			"Rem_globale_annuelle_médiane_ecart",
		);
		expect(Object.keys(decl.Indicateurs.C)).toContain(
			"Taux_horaire_global_médian_ecart",
		);
		expect(Object.keys(decl.Indicateurs.D)).toContain(
			"Rem_variable_annuelle_médiane_ecart",
		);
		expect(Object.keys(decl.Indicateurs.D)).toContain(
			"Taux_horaire_variable_médian_ecart",
		);
		expect(Object.keys(decl.Indicateurs.E)).toContain("Proportion_variable_F");
		expect(Object.keys(decl.Indicateurs.E)).toContain("Proportion_variable_H");

		expect(expectedKeys).toHaveLength(10);
	});

	it("should expose new lifecycle SUIT fields (T5)", async () => {
		mockFetchSubmitted.mockResolvedValue([
			{
				declarationId: "decl-1",
				siren: "123456789",
				year: 2027,
				status: "demarche_completed",
				firstDeclarationPathChoice: "corrective_action",
				secondDeclarationPathChoice: "joint_evaluation",
				totalWomen: 100,
				totalMen: 150,
				submittedAt: new Date("2027-03-15T10:00:00Z"),
				firstDeclarationPathChoiceAt: new Date("2027-04-01T10:00:00Z"),
				secondDeclarationPathChoiceAt: new Date("2027-08-01T10:00:00Z"),
				secondDeclarationSubmittedAt: new Date("2027-06-01T11:00:00Z"),
				jointEvaluationSubmittedAt: new Date("2027-09-01T12:00:00Z"),
				cseOpinionCompletedAt: new Date("2027-10-01T13:00:00Z"),
				demarcheCompletedAt: new Date("2027-10-15T14:00:00Z"),
				cseRequired: true,
				rulesVersion: "2027.1",
				secondDeclReferencePeriodStart: null,
				secondDeclReferencePeriodEnd: null,
				createdAt: new Date("2027-03-15T10:00:00Z"),
				updatedAt: new Date("2027-10-15T14:00:00Z"),
				cancelledAt: null,
				companyName: "ACME Corp",
				workforceEma: "250.00",
				nafCode: "62.02",
				address: "1 rue test",
				hasCse: true,
				declarantFirstName: "Jean",
				declarantLastName: "Dupont",
				declarantEmail: "jean@acme.fr",
				declarantPhone: "0612345678",
				...nullIndicators,
				globalAnnualMeanGap: "0.10",
				variableAnnualMeanGap: "0.08",
			},
		]);
		// Significant gap (≈9.1% > 5%) for the initial round → complianceProcessRequired=true
		// Plus a correction entry with the same gap → complianceProcessRevisionRequired=true
		mockFetchIndicatorG.mockResolvedValueOnce(
			new Map([
				[
					"decl-1",
					[
						{
							categoryName: "cadres",
							source: null,
							declarationType: "initial",
							womenCount: 10,
							menCount: 11,
							annualBaseWomen: "10000",
							annualBaseMen: "11000",
							annualVariableWomen: null,
							annualVariableMen: null,
							hourlyBaseWomen: null,
							hourlyBaseMen: null,
							hourlyVariableWomen: null,
							hourlyVariableMen: null,
						},
						{
							categoryName: "cadres",
							source: null,
							declarationType: "correction",
							womenCount: 10,
							menCount: 11,
							annualBaseWomen: "10000",
							annualBaseMen: "11000",
							annualVariableWomen: null,
							annualVariableMen: null,
							hourlyBaseWomen: null,
							hourlyBaseMen: null,
							hourlyVariableWomen: null,
							hourlyVariableMen: null,
						},
					],
				],
			]),
		);

		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = gatewayForwardedRequest(
			"http://localhost/api/v1/export/declarations?date_begin=2027-10-15",
		);
		const response = await GET(request);

		expect(response.status).toBe(200);
		const body = await response.json();
		const decl = body.Declarations[0];

		expect(decl).not.toHaveProperty("Parcours_conformite");
		expect(decl.Parcours_apres_declaration_1).toBe("corrective_action");
		expect(decl.Parcours_apres_declaration_2).toBe("joint_evaluation");
		expect(decl.Parcours.Parcours_de_conformite_requis).toBe(true);
		expect(decl.Parcours.Parcours_de_conformite_revision_requis).toBe(true);
		expect(decl).not.toHaveProperty("Phase_2_requise");
		expect(decl).not.toHaveProperty("Phase_2_revision_requise");
		expect(decl.Parcours.Avis_CSE_requis).toBe(true);
		expect(decl.Parcours.Indicateur_G_requis).toBe(true);
		expect(decl.Parcours.Version_regles).toBe("2027.1");
		expect(decl.Date_soumission).toBe("2027-03-15T10:00:00.000Z");
		expect(decl.Date_parcours_apres_declaration_1).toBe(
			"2027-04-01T10:00:00.000Z",
		);
		expect(decl.Date_parcours_apres_declaration_2).toBe(
			"2027-08-01T10:00:00.000Z",
		);
		expect(decl.Date_seconde_declaration).toBe("2027-06-01T11:00:00.000Z");
		expect(decl.Date_evaluation_conjointe).toBe("2027-09-01T12:00:00.000Z");
		expect(decl.Date_avis_CSE).toBe("2027-10-01T13:00:00.000Z");
		expect(decl.Date_fin_demarche).toBe("2027-10-15T14:00:00.000Z");
		expect(decl.Seconde_declaration.Statut).toBe(true);
		for (const key of RELOCATED_ROOT_KEYS) {
			expect(decl).not.toHaveProperty(key);
		}
	});

	it("should thread the job-category source into Source_categories_emplois (#3944)", async () => {
		mockFetchSubmitted.mockResolvedValue([
			{
				declarationId: "decl-1",
				siren: "123456789",
				year: 2027,
				status: "awaiting_compliance_path_choice",
				firstDeclarationPathChoice: null,
				secondDeclarationPathChoice: null,
				totalWomen: 100,
				totalMen: 150,
				submittedAt: null,
				firstDeclarationPathChoiceAt: null,
				secondDeclarationPathChoiceAt: null,
				secondDeclarationSubmittedAt: null,
				jointEvaluationSubmittedAt: null,
				cseOpinionCompletedAt: null,
				demarcheCompletedAt: null,
				complianceProcessRequired: false,
				complianceProcessRevisionRequired: false,
				cseRequired: false,
				indicatorGRequired: false,
				rulesVersion: "2027.1",
				secondDeclReferencePeriodStart: null,
				secondDeclReferencePeriodEnd: null,
				createdAt: new Date("2027-03-15T10:00:00Z"),
				updatedAt: new Date("2027-03-15T12:00:00Z"),
				cancelledAt: null,
				companyName: "ACME Corp",
				workforceEma: "250.00",
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
		mockFetchIndicatorG.mockResolvedValueOnce(
			new Map([
				[
					"decl-1",
					[
						{
							categoryName: "cadres",
							source: "accord-branche",
							declarationType: "initial",
							womenCount: 10,
							menCount: 10,
							annualBaseWomen: "100",
							annualBaseMen: "100",
							annualVariableWomen: null,
							annualVariableMen: null,
							hourlyBaseWomen: null,
							hourlyBaseMen: null,
							hourlyVariableWomen: null,
							hourlyVariableMen: null,
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
		const decl = (await response.json()).Declarations[0];
		expect(decl.Source_categories_emplois).toBe("accord-branche");
	});

	it("should expose Source_categories_emplois=null when the declaration has no indicator G (#3944)", async () => {
		mockFetchSubmitted.mockResolvedValue([
			{
				declarationId: "decl-1",
				siren: "123456789",
				year: 2027,
				status: "awaiting_compliance_path_choice",
				firstDeclarationPathChoice: null,
				secondDeclarationPathChoice: null,
				totalWomen: 100,
				totalMen: 150,
				submittedAt: null,
				firstDeclarationPathChoiceAt: null,
				secondDeclarationPathChoiceAt: null,
				secondDeclarationSubmittedAt: null,
				jointEvaluationSubmittedAt: null,
				cseOpinionCompletedAt: null,
				demarcheCompletedAt: null,
				complianceProcessRequired: false,
				complianceProcessRevisionRequired: false,
				cseRequired: false,
				indicatorGRequired: false,
				rulesVersion: "2027.1",
				secondDeclReferencePeriodStart: null,
				secondDeclReferencePeriodEnd: null,
				createdAt: new Date("2027-03-15T10:00:00Z"),
				updatedAt: new Date("2027-03-15T12:00:00Z"),
				cancelledAt: null,
				companyName: "ACME Corp",
				workforceEma: "250.00",
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

		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = gatewayForwardedRequest(
			"http://localhost/api/v1/export/declarations?date_begin=2027-03-15",
		);
		const response = await GET(request);

		expect(response.status).toBe(200);
		const decl = (await response.json()).Declarations[0];
		expect(decl.Source_categories_emplois).toBeNull();
	});

	it("should include Historique_statuts with FR labels and Numero_declaration on path_choice entries", async () => {
		mockFetchSubmitted.mockResolvedValue([
			{
				declarationId: "decl-1",
				siren: "123456789",
				year: 2027,
				status: "awaiting_compliance_path_choice",
				firstDeclarationPathChoice: "corrective_action",
				secondDeclarationPathChoice: null,
				totalWomen: 100,
				totalMen: 150,
				submittedAt: new Date("2027-03-15T10:00:00Z"),
				firstDeclarationPathChoiceAt: new Date("2027-04-01T10:00:00Z"),
				secondDeclarationPathChoiceAt: null,
				secondDeclarationSubmittedAt: null,
				jointEvaluationSubmittedAt: null,
				cseOpinionCompletedAt: null,
				demarcheCompletedAt: null,
				phase2Required: false,
				phase2RevisionRequired: false,
				cseRequired: false,
				indicatorGRequired: false,
				rulesVersion: "2027.1",
				secondDeclReferencePeriodStart: null,
				secondDeclReferencePeriodEnd: null,
				createdAt: new Date("2027-03-15T10:00:00Z"),
				updatedAt: new Date("2027-04-01T10:00:00Z"),
				cancelledAt: null,
				companyName: "ACME Corp",
				workforceEma: "250.00",
				nafCode: "62.02",
				address: "1 rue test",
				hasCse: false,
				declarantFirstName: "Jean",
				declarantLastName: "Dupont",
				declarantEmail: "jean@acme.fr",
				declarantPhone: "0612345678",
				...nullIndicators,
				statusHistoryArray: [
					{
						eventType: "submit",
						value: null,
						round: null,
						createdAt: "2027-03-15T10:00:00.000Z",
					},
					{
						eventType: "path_choice",
						value: "corrective_action",
						round: 1,
						createdAt: "2027-04-01T10:00:00.000Z",
					},
				],
			},
		]);

		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = gatewayForwardedRequest(
			"http://localhost/api/v1/export/declarations?date_begin=2027-03-15",
		);
		const response = await GET(request);

		expect(response.status).toBe(200);
		const body = await response.json();
		const decl = body.Declarations[0];
		expect(decl.Historique_statuts).toEqual([
			{
				Statut: "submit",
				Libelle_statut: "Soumission de la déclaration",
				Date: "2027-03-15T10:00:00.000Z",
			},
			{
				Statut: "path_choice",
				Libelle_statut: "Choix du parcours — Actions correctives",
				Date: "2027-04-01T10:00:00.000Z",
				Numero_declaration: 1,
			},
		]);
	});

	it("should expose Seconde_declaration.Statut=false when secondDeclarationSubmittedAt is null", async () => {
		mockFetchSubmitted.mockResolvedValue([
			{
				declarationId: "decl-1",
				siren: "123456789",
				year: 2027,
				status: "awaiting_compliance_path_choice",
				firstDeclarationPathChoice: null,
				secondDeclarationPathChoice: null,
				totalWomen: 100,
				totalMen: 150,
				submittedAt: null,
				firstDeclarationPathChoiceAt: null,
				secondDeclarationPathChoiceAt: null,
				secondDeclarationSubmittedAt: null,
				jointEvaluationSubmittedAt: null,
				cseOpinionCompletedAt: null,
				demarcheCompletedAt: null,
				complianceProcessRequired: false,
				complianceProcessRevisionRequired: false,
				cseRequired: false,
				indicatorGRequired: false,
				rulesVersion: "2027.1",
				secondDeclReferencePeriodStart: null,
				secondDeclReferencePeriodEnd: null,
				createdAt: new Date("2027-03-15T10:00:00Z"),
				updatedAt: new Date("2027-03-15T12:00:00Z"),
				cancelledAt: null,
				companyName: "ACME Corp",
				workforceEma: "250.00",
				nafCode: "62.02",
				address: "1 rue test",
				hasCse: false,
				declarantFirstName: "Jean",
				declarantLastName: "Dupont",
				declarantEmail: "jean@acme.fr",
				declarantPhone: "0612345678",
				...nullIndicators,
			},
		]);

		const { GET } = await import("~/app/api/v1/export/declarations/route");
		const request = gatewayForwardedRequest(
			"http://localhost/api/v1/export/declarations?date_begin=2027-03-15",
		);
		const response = await GET(request);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.Declarations[0].Seconde_declaration.Statut).toBe(false);
		expect(body.Declarations[0].Date_seconde_declaration).toBeNull();
	});

	describe("Parcours.Prochaines_etapes_possibles", () => {
		async function exportedDeclarations(rows: Record<string, unknown>[]) {
			mockFetchSubmitted.mockResolvedValue(rows);
			const { GET } = await import("~/app/api/v1/export/declarations/route");
			const response = await GET(
				gatewayForwardedRequest(
					"http://localhost/api/v1/export/declarations?date_begin=2027-03-15",
				),
			);

			expect(response.status).toBe(200);
			return response.json();
		}

		it("serialises the three compliance paths of a CSE-bound company as the last Parcours key (S3)", async () => {
			const body = await exportedDeclarations([
				declarationRow({
					status: "awaiting_compliance_path_choice",
					cseRequired: true,
				}),
			]);
			const { Parcours } = body.Declarations[0];

			expect(Object.keys(Parcours).at(-1)).toBe("Prochaines_etapes_possibles");
			expect(
				Parcours.Prochaines_etapes_possibles.map(
					(step: { Identifiant_transition: string }) =>
						step.Identifiant_transition,
				),
			).toEqual([
				"choose_path_initial_justify_with_cse",
				"choose_path_initial_corrective_action",
				"choose_path_initial_joint_evaluation",
			]);
			for (const step of Parcours.Prochaines_etapes_possibles) {
				expect(step).not.toHaveProperty("Condition");
			}
		});

		it("keeps the Condition of an undecided guard through JSON serialisation (S4)", async () => {
			const body = await exportedDeclarations([
				declarationRow({
					status: "corrective_actions_chosen",
					cseRequired: true,
				}),
			]);

			expect(body.Declarations[0].Parcours.Prochaines_etapes_possibles).toEqual(
				[
					{
						Identifiant_transition: "submit_second_declaration_persistent_gap",
						Action: "submit_second_declaration",
						Etat_cible: "awaiting_revision_choice",
						Libelle: STAGE_LABELS.revisionChoice,
						Condition: GAP_PERSISTS_CONDITION,
					},
					{
						Identifiant_transition:
							"submit_second_declaration_resolved_with_cse",
						Action: "submit_second_declaration",
						Etat_cible: "awaiting_cse_opinion",
						Libelle: STAGE_LABELS.cseOpinion,
						Condition: GAP_RESOLVED_CONDITION,
					},
				],
			);
		});

		it("exports an empty array for a cancelled declaration, with no redeclare step invented (S5)", async () => {
			const body = await exportedDeclarations([
				declarationRow({
					status: "corrective_actions_chosen",
					cancelledAt: new Date("2027-04-15T08:00:00Z"),
				}),
			]);
			const decl = body.Declarations[0];

			expect(decl.Parcours.Prochaines_etapes_possibles).toEqual([]);
			expect(decl.Parcours.Annulee).toBe(true);
			expect(decl.Date_annulation).toBe("2027-04-15T08:00:00.000Z");
			expect(decl.Parcours.Statut).toBe("corrective_actions_chosen");
		});

		it("keeps offering the CSE opinion on a completed démarche (S6)", async () => {
			const body = await exportedDeclarations([
				declarationRow({ status: "demarche_completed", cseRequired: true }),
			]);
			const { Parcours } = body.Declarations[0];

			expect(Parcours.Annulee).toBe(false);
			expect(Parcours.Prochaines_etapes_possibles).toEqual([
				{
					Identifiant_transition: "submit_cse_opinion",
					Action: "submit_cse_opinion",
					Etat_cible: "demarche_completed",
					Libelle: STAGE_LABELS.completion,
				},
			]);
		});

		it("answers 200 with both declarations when the stored rules version is missing or unknown, without rewriting it (S7)", async () => {
			const body = await exportedDeclarations([
				declarationRow({
					declarationId: "decl-null-version",
					status: "corrective_actions_chosen",
					rulesVersion: null,
				}),
				declarationRow({
					declarationId: "decl-unknown-version",
					siren: "987654321",
					status: "corrective_actions_chosen",
					rulesVersion: "1999.0",
				}),
			]);
			const [nullVersion, unknownVersion] = body.Declarations;

			expect(body.Nombre).toBe(2);
			expect(nullVersion.Parcours.Version_regles).toBeNull();
			expect(unknownVersion.Parcours.Version_regles).toBe("1999.0");
			expect(nullVersion.Parcours.Prochaines_etapes_possibles).not.toHaveLength(
				0,
			);
			expect(unknownVersion.Parcours.Prochaines_etapes_possibles).toEqual(
				nullVersion.Parcours.Prochaines_etapes_possibles,
			);
		});

		it("leaves the envelope and the payload root untouched (S10)", async () => {
			const body = await exportedDeclarations([declarationRow()]);

			expect(Object.keys(body)).toEqual([
				"Date_debut",
				"Date_fin",
				"Nombre",
				"Declarations",
			]);
			expect(body.Date_debut).toBe("2027-03-15");
			expect(body.Date_fin).toBe("2027-03-16");
			expect(body.Declarations[0]).not.toHaveProperty(
				"Prochaines_etapes_possibles",
			);
		});
	});
});
