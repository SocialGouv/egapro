import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

describe("buildExportRows", () => {
	// Mock DB chain: select().from().innerJoin().innerJoin().where()
	const mockWhere = vi.fn();
	const mockInnerJoin2 = vi.fn(() => ({ where: mockWhere }));
	const mockInnerJoin1 = vi.fn(() => ({ innerJoin: mockInnerJoin2 }));
	const mockFrom = vi.fn(() => ({ innerJoin: mockInnerJoin1 }));
	// Mock for getDeclarationsWithIndicatorG: selectDistinct().from().where()
	const mockJobWhere = vi.fn();
	const mockJobFrom = vi.fn(() => ({ where: mockJobWhere }));
	const mockSelectDistinct = vi.fn(() => ({ from: mockJobFrom }));

	// Mock for getCseOpinionsByDeclaration
	const mockCseWhere = vi.fn();
	const mockCseFrom = vi.fn(() => ({ where: mockCseWhere }));

	const mockSelectGeneric = vi.fn<(...args: unknown[]) => unknown>();

	const mockDb = {
		select: mockSelectGeneric,
		selectDistinct: mockSelectDistinct,
	};

	let callCount = 0;

	beforeEach(() => {
		vi.clearAllMocks();
		callCount = 0;

		// Call order: 1) declarations query, 2) CSE query
		mockSelectGeneric.mockImplementation(() => {
			callCount++;
			if (callCount === 1) return { from: mockFrom };
			return { from: mockCseFrom };
		});
	});

	it("should return empty array when no declarations match", async () => {
		mockWhere.mockResolvedValue([]);
		mockJobWhere.mockResolvedValue([]);
		mockCseWhere.mockResolvedValue([]);

		const { buildExportRows } = await import("../buildExportRows");
		const rows = await buildExportRows(mockDb as never, 2027);

		expect(rows).toEqual([]);
		expect(mockSelectGeneric).toHaveBeenCalled();
	});

	it("should map declaration rows to ExportRow format with year filter", async () => {
		const dbRow = {
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
			// Indicator A
			indicatorAAnnualWomen: "35000",
			indicatorAAnnualMen: "38000",
			indicatorAHourlyWomen: null,
			indicatorAHourlyMen: null,
			// Indicator B
			indicatorBAnnualWomen: null,
			indicatorBAnnualMen: null,
			indicatorBHourlyWomen: null,
			indicatorBHourlyMen: null,
			// Indicator C
			indicatorCAnnualWomen: null,
			indicatorCAnnualMen: null,
			indicatorCHourlyWomen: null,
			indicatorCHourlyMen: null,
			// Indicator D
			indicatorDAnnualWomen: null,
			indicatorDAnnualMen: null,
			indicatorDHourlyWomen: null,
			indicatorDHourlyMen: null,
			// Indicator E
			indicatorEWomen: null,
			indicatorEMen: null,
			// Indicator F — annual
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
			// Indicator F — hourly
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

		mockWhere.mockResolvedValue([dbRow]);
		mockJobWhere.mockResolvedValue([]);
		mockCseWhere.mockResolvedValue([]);

		const { buildExportRows } = await import("../buildExportRows");
		const rows = await buildExportRows(mockDb as never, 2027);

		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({
			siren: "123456789",
			companyName: "ACME Corp",
			declarationType: "6_indicateurs",
			year: 2027,
			declarantEmail: "jean@acme.fr",
			indAAnnualWomen: "35000",
			indAAnnualMen: "38000",
			indAHourlyWomen: null,
			indFAnnualQ1Women: null,
		});
	});

	it("should set declarationType to 7_indicateurs when job categories exist", async () => {
		const dbRow = {
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
			categoryScore: 8,
			secondDeclarationStatus: null,
			secondDeclReferencePeriodStart: null,
			secondDeclReferencePeriodEnd: null,
			createdAt: new Date("2027-03-15T10:00:00Z"),
			updatedAt: new Date("2027-03-15T12:00:00Z"),
			companyName: "BigCo",
			workforce: 500,
			nafCode: "70.10",
			address: "2 rue test",
			hasCse: true,
			declarantFirstName: "Marie",
			declarantLastName: "Martin",
			declarantEmail: "marie@bigco.fr",
			declarantPhone: null,
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

		mockWhere.mockResolvedValue([dbRow]);
		mockJobWhere.mockResolvedValue([{ declarationId: "decl-1" }]);
		mockCseWhere.mockResolvedValue([]);

		const { buildExportRows } = await import("../buildExportRows");
		const rows = await buildExportRows(mockDb as never, 2027);

		expect(rows[0]?.declarationType).toBe("7_indicateurs");
	});

	it("should map CSE opinions to the correct slots", async () => {
		const dbRow = {
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

		mockWhere.mockResolvedValue([dbRow]);
		mockJobWhere.mockResolvedValue([]);
		mockCseWhere.mockResolvedValue([
			{
				declarationId: "decl-1",
				type: "accuracy",
				opinion: "favorable",
				opinionDate: "2027-01-15",
			},
			{
				declarationId: "decl-1",
				type: "gap",
				opinion: "unfavorable",
				opinionDate: "2027-02-20",
			},
		]);

		const { buildExportRows } = await import("../buildExportRows");
		const rows = await buildExportRows(mockDb as never, 2027);

		expect(rows[0]).toMatchObject({
			cseOpinion1Type: "accuracy",
			cseOpinion1Opinion: "favorable",
			cseOpinion1Date: "2027-01-15",
			cseOpinion2Type: "gap",
			cseOpinion2Opinion: "unfavorable",
			cseOpinion2Date: "2027-02-20",
			cseOpinion3Type: null,
			cseOpinion4Type: null,
		});
	});

	it("should handle null createdAt and updatedAt", async () => {
		const dbRow = {
			declarationId: "decl-1",
			siren: "123456789",
			year: 2027,
			status: "submitted",
			compliancePath: null,
			totalWomen: null,
			totalMen: null,
			remunerationScore: null,
			variableRemunerationScore: null,
			quartileScore: null,
			categoryScore: null,
			secondDeclarationStatus: null,
			secondDeclReferencePeriodStart: null,
			secondDeclReferencePeriodEnd: null,
			createdAt: null,
			updatedAt: null,
			companyName: "NullCo",
			workforce: null,
			nafCode: null,
			address: null,
			hasCse: null,
			declarantFirstName: null,
			declarantLastName: null,
			declarantEmail: "null@co.fr",
			declarantPhone: null,
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

		mockWhere.mockResolvedValue([dbRow]);
		mockJobWhere.mockResolvedValue([]);
		mockCseWhere.mockResolvedValue([]);

		const { buildExportRows } = await import("../buildExportRows");
		const rows = await buildExportRows(mockDb as never, 2027);

		expect(rows[0]).toMatchObject({
			createdAt: null,
			updatedAt: null,
			workforce: null,
		});
	});
});
