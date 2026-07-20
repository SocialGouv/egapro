import { beforeEach, describe, expect, it, vi } from "vitest";

describe("buildExportRows", () => {
	// Mock DB chain: select().from().innerJoin().leftJoin().innerJoin().where()
	const mockWhere = vi.fn();
	const mockInnerJoin2 = vi.fn(() => ({ where: mockWhere }));
	const mockLeftJoin = vi.fn(() => ({ innerJoin: mockInnerJoin2 }));
	const mockInnerJoin1 = vi.fn(() => ({ leftJoin: mockLeftJoin }));
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
			firstDeclarationPathChoice: null,
			secondDeclarationPathChoice: null,
			totalWomen: 100,
			totalMen: 150,
			remunerationScore: 5,
			variableRemunerationScore: 3,
			quartileScore: 2,
			categoryScore: null,
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
			firstDeclarationPathChoice: null,
			secondDeclarationPathChoice: null,
			totalWomen: 100,
			totalMen: 150,
			remunerationScore: 5,
			variableRemunerationScore: 3,
			quartileScore: 2,
			categoryScore: 8,
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
			companyName: "BigCo",
			workforceEma: "500.00",
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
			firstDeclarationPathChoice: null,
			secondDeclarationPathChoice: null,
			totalWomen: 100,
			totalMen: 150,
			remunerationScore: 5,
			variableRemunerationScore: 3,
			quartileScore: 2,
			categoryScore: null,
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
			firstDeclarationPathChoice: null,
			secondDeclarationPathChoice: null,
			totalWomen: null,
			totalMen: null,
			remunerationScore: null,
			variableRemunerationScore: null,
			quartileScore: null,
			categoryScore: null,
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
			createdAt: null,
			updatedAt: null,
			cancelledAt: null,
			companyName: "NullCo",
			workforceEma: null,
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

	it("should serialize cancelledAt as ISO string for cancelled declarations", async () => {
		const dbRow = makeMinimalDbRow({
			declarationId: "decl-cancelled",
			siren: "555555555",
			cancelledAt: new Date("2027-04-20T08:30:00Z"),
			companyName: "CancelCo",
			declarantFirstName: "Anne",
			declarantLastName: "Lopez",
			declarantEmail: "anne@cancelco.fr",
			indicatorAAnnualWomen: "30000",
			indicatorAAnnualMen: "32000",
		});

		mockWhere.mockResolvedValue([dbRow]);
		mockJobWhere.mockResolvedValue([]);
		mockCseWhere.mockResolvedValue([]);

		const { buildExportRows } = await import("../buildExportRows");
		const rows = await buildExportRows(mockDb as never, 2027);

		expect(rows[0]).toMatchObject({
			siren: "555555555",
			cancelledAt: "2027-04-20T08:30:00.000Z",
			indAAnnualWomen: "30000",
			indAAnnualMen: "32000",
		});
	});

	it("should expose both compliance path choices and the 7 lifecycle timestamps for a completed demarche", async () => {
		const dbRow = makeMinimalDbRow({
			declarationId: "decl-completed",
			siren: "100100100",
			status: "demarche_completed",
			workforceEma: "300.00",
			globalAnnualMeanGap: "0.10",
			variableAnnualMeanGap: "0.08",
			firstDeclarationPathChoice: "corrective_action",
			secondDeclarationPathChoice: "joint_evaluation",
			submittedAt: new Date("2027-03-01T09:00:00Z"),
			firstDeclarationPathChoiceAt: new Date("2027-04-01T10:00:00Z"),
			secondDeclarationPathChoiceAt: new Date("2027-08-01T10:00:00Z"),
			secondDeclarationSubmittedAt: new Date("2027-06-01T11:00:00Z"),
			jointEvaluationSubmittedAt: new Date("2027-09-01T12:00:00Z"),
			cseOpinionCompletedAt: new Date("2027-10-01T13:00:00Z"),
			demarcheCompletedAt: new Date("2027-10-15T14:00:00Z"),
			cseRequired: true,
			rulesVersion: "2027.1",
		});

		mockWhere.mockResolvedValue([dbRow]);
		mockJobWhere.mockResolvedValue([{ declarationId: "decl-completed" }]);
		mockCseWhere.mockResolvedValue([]);

		const { buildExportRows } = await import("../buildExportRows");
		const rows = await buildExportRows(mockDb as never, 2027);

		expect(rows[0]).toMatchObject({
			firstDeclarationPathChoice: "corrective_action",
			secondDeclarationPathChoice: "joint_evaluation",
			submittedAt: "2027-03-01T09:00:00.000Z",
			firstDeclarationPathChoiceAt: "2027-04-01T10:00:00.000Z",
			secondDeclarationPathChoiceAt: "2027-08-01T10:00:00.000Z",
			secondDeclarationSubmittedAt: "2027-06-01T11:00:00.000Z",
			jointEvaluationSubmittedAt: "2027-09-01T12:00:00.000Z",
			cseOpinionCompletedAt: "2027-10-01T13:00:00.000Z",
			demarcheCompletedAt: "2027-10-15T14:00:00.000Z",
			complianceProcessRequired: true,
			complianceProcessRevisionRequired: true,
			cseRequired: true,
			indicatorGRequired: true,
			rulesVersion: "2027.1",
			secondDeclarationSubmitted: true,
		});
	});

	it("should not flag complianceProcessRequired when the gap is negative (women earn more)", async () => {
		// Signed stored gap -0.10 (women earn more): |gap| >= 5% but negative → no obligation (GIP).
		const dbRow = makeMinimalDbRow({
			declarationId: "decl-negative-gap",
			siren: "200200200",
			workforceEma: "300.00",
			globalAnnualMeanGap: "-0.10",
			variableAnnualMeanGap: "-0.08",
			secondDeclarationSubmittedAt: new Date("2027-06-01T11:00:00Z"),
		});

		mockWhere.mockResolvedValue([dbRow]);
		mockJobWhere.mockResolvedValue([{ declarationId: "decl-negative-gap" }]);
		mockCseWhere.mockResolvedValue([]);

		const { buildExportRows } = await import("../buildExportRows");
		const rows = await buildExportRows(mockDb as never, 2027);

		expect(rows[0]).toMatchObject({
			complianceProcessRequired: false,
			complianceProcessRevisionRequired: false,
		});
	});

	it("should export the GIP workforce floored, not the Weez company workforce (#3929)", async () => {
		const dbRow = makeMinimalDbRow({
			declarationId: "decl-gip",
			siren: "432491777",
			workforceEma: "70.00",
		});

		mockWhere.mockResolvedValue([dbRow]);
		mockJobWhere.mockResolvedValue([]);
		mockCseWhere.mockResolvedValue([]);

		const { buildExportRows } = await import("../buildExportRows");
		const rows = await buildExportRows(mockDb as never, 2027);

		expect(rows[0]).toMatchObject({
			workforce: 70,
			indicatorGRequired: false,
		});
	});

	it("should floor the GIP workforce so 99,97 never exports as 100", async () => {
		const dbRow = makeMinimalDbRow({
			declarationId: "decl-rounding",
			workforceEma: "99.97",
			globalAnnualMeanGap: "0.10",
		});

		mockWhere.mockResolvedValue([dbRow]);
		mockJobWhere.mockResolvedValue([{ declarationId: "decl-rounding" }]);
		mockCseWhere.mockResolvedValue([]);

		const { buildExportRows } = await import("../buildExportRows");
		const rows = await buildExportRows(mockDb as never, 2027);

		expect(rows[0]).toMatchObject({
			workforce: 99,
			complianceProcessRequired: false,
		});
	});

	it("should keep a declaration whose company is absent from the GIP file, with a null workforce", async () => {
		const dbRow = makeMinimalDbRow({
			declarationId: "decl-no-gip",
			siren: "999999999",
			workforceEma: null,
			globalAnnualMeanGap: "0.10",
		});

		mockWhere.mockResolvedValue([dbRow]);
		mockJobWhere.mockResolvedValue([{ declarationId: "decl-no-gip" }]);
		mockCseWhere.mockResolvedValue([]);

		const { buildExportRows } = await import("../buildExportRows");
		const rows = await buildExportRows(mockDb as never, 2027);

		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({
			siren: "999999999",
			workforce: null,
			indicatorGRequired: false,
			complianceProcessRequired: false,
		});
	});

	it("should derive secondDeclarationSubmitted=false when secondDeclarationSubmittedAt is null", async () => {
		const dbRow = makeMinimalDbRow({
			secondDeclarationSubmittedAt: null,
		});

		mockWhere.mockResolvedValue([dbRow]);
		mockJobWhere.mockResolvedValue([]);
		mockCseWhere.mockResolvedValue([]);

		const { buildExportRows } = await import("../buildExportRows");
		const rows = await buildExportRows(mockDb as never, 2027);

		expect(rows[0]?.secondDeclarationSubmitted).toBe(false);
		expect(rows[0]?.secondDeclarationSubmittedAt).toBeNull();
	});
});

type DbRow = Record<string, unknown>;

function makeMinimalDbRow(overrides: DbRow): DbRow {
	return {
		declarationId: "decl-1",
		siren: "123456789",
		year: 2027,
		status: "submitted",
		firstDeclarationPathChoice: null,
		secondDeclarationPathChoice: null,
		totalWomen: null,
		totalMen: null,
		remunerationScore: null,
		variableRemunerationScore: null,
		quartileScore: null,
		categoryScore: null,
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
		companyName: "ACME",
		workforceEma: null,
		nafCode: null,
		address: null,
		hasCse: null,
		declarantFirstName: null,
		declarantLastName: null,
		declarantEmail: "a@b.fr",
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
		...overrides,
	};
}
