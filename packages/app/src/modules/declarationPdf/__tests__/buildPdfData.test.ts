import { beforeEach, describe, expect, it, vi } from "vitest";

type TableKey =
	| "declarations"
	| "companies"
	| "users"
	| "gipMdsData"
	| "jobCategories"
	| "employeeCategories"
	| "declarationStatusHistory";

// Result sets keyed by the queried table. buildPdfData issues most queries via
// `Promise.all`, so execution order is not stable — the mock keys results by the
// table passed to `.from()` (via the schema token's `__table` tag) instead of by
// call order. `declarationStatusHistory` is queried up to twice per build
// (second_declaration_submit then submit), so it holds a FIFO sub-queue.
const results = new Map<TableKey, unknown[][]>();

function settle(table: TableKey) {
	const queued = results.get(table);
	const result = queued?.shift() ?? [];
	return Object.assign(Promise.resolve(result), {
		limit: () => Promise.resolve(result),
		orderBy: () => ({ limit: () => Promise.resolve(result) }),
	});
}

vi.mock("~/server/db", () => ({
	db: {
		select: () => ({
			from: (table: { __table: TableKey }) => ({
				where: () => settle(table.__table),
			}),
		}),
	},
}));

vi.mock("~/server/db/schema", () => ({
	declarations: {
		__table: "declarations",
		id: "id",
		siren: "siren",
		year: "year",
	},
	companies: { __table: "companies", siren: "siren" },
	users: { __table: "users", id: "id" },
	gipMdsData: { __table: "gipMdsData", siren: "siren", year: "year" },
	jobCategories: { __table: "jobCategories", declarationId: "declarationId" },
	employeeCategories: {
		__table: "employeeCategories",
		jobCategoryId: "jobCategoryId",
	},
	declarationStatusHistory: {
		__table: "declarationStatusHistory",
		declarationId: "declarationId",
		eventType: "eventType",
		createdAt: "createdAt",
	},
	// Pulled in at module scope by the ~/modules/public-api barrel, which
	// buildPdfData reaches transitively through server/auth/config.
	representationDeclarations: {
		__table: "representationDeclarations",
		siren: "siren",
		year: "year",
		status: "status",
		referencePeriodStart: "referencePeriodStart",
		referencePeriodEnd: "referencePeriodEnd",
		executiveWomenPercent: "executiveWomenPercent",
		executiveMenPercent: "executiveMenPercent",
		notComputableReasonExecutives: "notComputableReasonExecutives",
		memberWomenPercent: "memberWomenPercent",
		memberMenPercent: "memberMenPercent",
		notComputableReasonMembers: "notComputableReasonMembers",
		publishDate: "publishDate",
		publishUrl: "publishUrl",
		publishModalities: "publishModalities",
	},
}));

vi.mock("~/server/api/routers/declarationHelpers", () => ({
	activeDeclarationFilter: (siren: string, year: number) => ({ siren, year }),
	mapToStepData: (d: Record<string, unknown>) => ({
		step2Data: {
			indicatorAAnnualWomen: (d.indicatorAAnnualWomen as string) ?? "",
		},
		step3Data: { indicatorEWomen: (d.indicatorEWomen as string) ?? "" },
		step4Data: { annual: [], hourly: [] },
	}),
	mapToEmployeeCategoryRows: (
		jobs: { name: string }[],
		_empCats: unknown[],
		_type: string,
	) => jobs.map((j) => ({ name: j.name })),
}));

vi.mock("drizzle-orm", () => ({
	and: (...args: unknown[]) => args,
	desc: (col: unknown) => col,
	eq: (col: unknown, val: unknown) => ({ col, val }),
	inArray: (col: unknown, values: unknown) => ({ col, values }),
}));

// One entry per table. `declarationStatusHistory` takes an array of result sets
// (consumed FIFO) since it can be queried twice within one build.
type QueueSpec = Partial<
	Record<Exclude<TableKey, "declarationStatusHistory">, unknown[]>
> & { declarationStatusHistory?: unknown[][] };

function queue(spec: QueueSpec) {
	results.clear();
	for (const [table, value] of Object.entries(spec)) {
		if (table === "declarationStatusHistory") {
			results.set(table, value as unknown[][]);
		} else {
			results.set(table as TableKey, [value as unknown[]]);
		}
	}
}

const SUBMITTED = new Date("2026-03-05T10:00:00Z");
const SECOND_SUBMIT = new Date("2026-06-05T10:00:00Z");
const NOW = new Date("2026-03-09T00:00:00Z");

async function importBuild() {
	const { buildPdfData } = await import("../buildPdfData");
	return buildPdfData;
}

describe("buildPdfData", () => {
	beforeEach(() => {
		results.clear();
	});

	it("throws when the declaration is not found", async () => {
		queue({ declarations: [] });
		const buildPdfData = await importBuild();
		await expect(buildPdfData("123456789", 2026, NOW)).rejects.toThrow(
			"Déclaration introuvable",
		);
	});

	it("throws when the declaration is still a draft", async () => {
		queue({
			declarations: [
				{ id: "d1", siren: "123456789", year: 2026, status: "draft" },
			],
		});
		const buildPdfData = await importBuild();
		await expect(buildPdfData("123456789", 2026, NOW)).rejects.toThrow(
			"La déclaration n'est pas encore soumise",
		);
	});

	it("assembles declarant, company, GIP workforce, source and transmission date for an initial declaration", async () => {
		queue({
			declarations: [
				{
					id: "d1",
					siren: "123456789",
					year: 2026,
					status: "submitted",
					declarantId: "user-1",
					totalWomen: 50,
					totalMen: 60,
					updatedAt: new Date("2026-03-01T00:00:00Z"),
					indicatorAAnnualWomen: "45000",
					indicatorEWomen: "80",
				},
			],
			companies: [
				{
					siren: "123456789",
					name: "Société Démo",
					address: "1 rue de la Paix, 75002 Paris",
					nafCode: "6201Z",
					nafLabel: "Programmation informatique",
				},
			],
			users: [
				{
					firstName: "Jean",
					lastName: "Martin",
					email: "email@example.fr",
					phone: "0102030405",
				},
			],
			gipMdsData: [{ workforceEma: "250.7" }],
			jobCategories: [
				{
					id: "job-1",
					name: "Ouvriers",
					categoryIndex: 0,
					source: "accord-entreprise",
				},
			],
			employeeCategories: [{ jobCategoryId: "job-1" }],
			declarationStatusHistory: [[{ createdAt: SUBMITTED }]],
		});
		const buildPdfData = await importBuild();
		const result = await buildPdfData("123456789", 2026, NOW);

		expect(result.year).toBe(2026);
		expect(result.workforceYear).toBe(2025);
		expect(result.isSecondDeclaration).toBe(false);
		expect(result.referencePeriod).toBe("01/01/2025 - 31/12/2025");
		expect(result.transmittedAt).toBe("05/03/2026");

		expect(result.declarant).toEqual({
			name: "Jean Martin",
			email: "email@example.fr",
			phone: "0102030405",
		});

		expect(result.company).toEqual({
			name: "Société Démo",
			siren: "123456789",
			address: "1 rue de la Paix, 75002 Paris",
			nafCode: "6201Z",
			nafLabel: "Programmation informatique",
			workforceDisplay: (250).toLocaleString("fr-FR"),
		});

		expect(result.totalWomen).toBe(50);
		expect(result.totalMen).toBe(60);
		expect(result.categories).toEqual([{ name: "Ouvriers" }]);
		expect(result.source).toBe("Accord d'entreprise");
	});

	it("displays the GIP-absent placeholder and a humanised source when GIP data and label are missing", async () => {
		queue({
			declarations: [
				{
					id: "d2",
					siren: "987654321",
					year: 2026,
					status: "submitted",
					declarantId: "user-2",
					totalWomen: null,
					totalMen: null,
					updatedAt: new Date("2026-03-01T00:00:00Z"),
				},
			],
			companies: [{ siren: "987654321", name: "Autre Démo" }],
			users: [{ firstName: "Alice", lastName: null, email: null, phone: null }],
			gipMdsData: [], // GIP data absent
			jobCategories: [
				{
					id: "job-9",
					name: "Cadres",
					categoryIndex: 0,
					source: "convention-maison",
				},
			],
			employeeCategories: [{ jobCategoryId: "job-9" }],
			declarationStatusHistory: [[{ createdAt: SUBMITTED }]],
		});
		const buildPdfData = await importBuild();
		const result = await buildPdfData("987654321", 2026, NOW);

		expect(result.company.workforceDisplay).toBe("< 50");
		expect(result.company.address).toBe("");
		expect(result.company.nafCode).toBeNull();
		expect(result.declarant).toEqual({
			name: "Alice",
			email: "",
			phone: "",
		});
		// Unknown source value is humanised rather than printed as a raw slug.
		expect(result.source).toBe("Convention maison");
	});

	it("falls back to a synthesized company name and zeroed totals when the company row is missing", async () => {
		queue({
			declarations: [
				{
					id: "d3",
					siren: "111222333",
					year: 2026,
					status: "submitted",
					declarantId: null,
					totalWomen: null,
					totalMen: null,
					updatedAt: new Date("2026-03-01T00:00:00Z"),
				},
			],
			companies: [], // company row missing
			gipMdsData: [],
			jobCategories: [], // empty → employeeCategories query is skipped
			// no declarantId → users query is skipped
			declarationStatusHistory: [[{ createdAt: SUBMITTED }]],
		});
		const buildPdfData = await importBuild();
		const result = await buildPdfData("111222333", 2026, NOW);

		expect(result.company.name).toBe("Entreprise 111222333");
		expect(result.totalWomen).toBe(0);
		expect(result.totalMen).toBe(0);
		expect(result.declarant).toEqual({ name: "", email: "", phone: "" });
		expect(result.categories).toEqual([]);
		expect(result.source).toBeNull();
	});

	it("uses the second_declaration_submit date for a correction declaration", async () => {
		queue({
			declarations: [
				{
					id: "d4",
					siren: "123456789",
					year: 2026,
					status: "submitted",
					declarantId: "user-1",
					totalWomen: 10,
					totalMen: 10,
					updatedAt: new Date("2026-03-01T00:00:00Z"),
				},
			],
			companies: [{ siren: "123456789", name: "Société Démo" }],
			users: [
				{
					firstName: "Jean",
					lastName: "Martin",
					email: "email@example.fr",
					phone: "",
				},
			],
			gipMdsData: [{ workforceEma: "120" }],
			jobCategories: [
				{
					id: "job-1",
					name: "Ouvriers",
					categoryIndex: 0,
					source: "accord-groupe",
				},
			],
			employeeCategories: [{ jobCategoryId: "job-1" }],
			// correction: second_declaration_submit event resolves first
			declarationStatusHistory: [[{ createdAt: SECOND_SUBMIT }]],
		});
		const buildPdfData = await importBuild();
		const result = await buildPdfData("123456789", 2026, NOW, "correction");

		expect(result.isSecondDeclaration).toBe(true);
		expect(result.transmittedAt).toBe("05/06/2026");
	});

	it("falls back through submit then updatedAt when no matching status event exists", async () => {
		queue({
			declarations: [
				{
					id: "d5",
					siren: "123456789",
					year: 2026,
					status: "submitted",
					declarantId: null,
					totalWomen: 1,
					totalMen: 1,
					updatedAt: new Date("2026-02-14T00:00:00Z"),
				},
			],
			companies: [{ siren: "123456789", name: "Société Démo" }],
			gipMdsData: [],
			jobCategories: [],
			// correction: second_declaration_submit (empty), then submit (empty)
			// → falls back to updatedAt
			declarationStatusHistory: [[], []],
		});
		const buildPdfData = await importBuild();
		const result = await buildPdfData("123456789", 2026, NOW, "correction");

		expect(result.transmittedAt).toBe("14/02/2026");
	});

	it("falls back to `now` when the declaration has no updatedAt and no submit event", async () => {
		queue({
			declarations: [
				{
					id: "d6",
					siren: "123456789",
					year: 2026,
					status: "submitted",
					declarantId: null,
					totalWomen: 1,
					totalMen: 1,
					updatedAt: null,
				},
			],
			companies: [{ siren: "123456789", name: "Société Démo" }],
			gipMdsData: [],
			jobCategories: [],
			// submit event empty → falls back to `now`
			declarationStatusHistory: [[]],
		});
		const buildPdfData = await importBuild();
		const result = await buildPdfData("123456789", 2026, NOW);

		expect(result.transmittedAt).toBe("09/03/2026");
	});
});
