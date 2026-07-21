import { beforeEach, describe, expect, it, vi } from "vitest";

const queryResults: unknown[][] = [];
let callIndex = 0;

// Records each query in call order and returns the next queued result set.
// Supports every chain shape used by buildPdfData: `.where().limit()`,
// `.where().orderBy().limit()` (status history) and awaited `.where()`
// (jobs / employeeCategories, no `.limit`).
vi.mock("~/server/db", () => {
	const settle = () => {
		const result = queryResults[callIndex++] ?? [];
		const chain = Object.assign(Promise.resolve(result), {
			limit: () => Promise.resolve(result),
			orderBy: () => ({ limit: () => Promise.resolve(result) }),
		});
		return chain;
	};
	return {
		db: {
			select: () => ({ from: () => ({ where: () => settle() }) }),
		},
	};
});

vi.mock("~/server/db/schema", () => ({
	declarations: { id: "id", siren: "siren", year: "year" },
	companies: { siren: "siren" },
	users: { id: "id" },
	gipMdsData: { siren: "siren", year: "year" },
	jobCategories: { declarationId: "declarationId" },
	employeeCategories: { jobCategoryId: "jobCategoryId" },
	declarationStatusHistory: {
		declarationId: "declarationId",
		eventType: "eventType",
		createdAt: "createdAt",
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
}));

function queue(...results: unknown[][]) {
	callIndex = 0;
	queryResults.length = 0;
	queryResults.push(...results);
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
		callIndex = 0;
		queryResults.length = 0;
	});

	it("throws when the declaration is not found", async () => {
		queue([]);
		const buildPdfData = await importBuild();
		await expect(buildPdfData("123456789", 2026, NOW)).rejects.toThrow(
			"Déclaration introuvable",
		);
	});

	it("throws when the declaration is still a draft", async () => {
		queue([{ id: "d1", siren: "123456789", year: 2026, status: "draft" }]);
		const buildPdfData = await importBuild();
		await expect(buildPdfData("123456789", 2026, NOW)).rejects.toThrow(
			"La déclaration n'est pas encore soumise",
		);
	});

	it("assembles declarant, company, GIP workforce, source and transmission date for an initial declaration", async () => {
		queue(
			// declarations
			[
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
			// companies
			[
				{
					siren: "123456789",
					name: "Société Démo",
					address: "1 rue de la Paix, 75002 Paris",
					nafCode: "6201Z",
					nafLabel: "Programmation informatique",
				},
			],
			// users (declarant)
			[
				{
					firstName: "Jean",
					lastName: "Martin",
					email: "email@example.fr",
					phone: "0102030405",
				},
			],
			// gipMdsData
			[{ workforceEma: "250.7" }],
			// jobCategories
			[
				{
					id: "job-1",
					name: "Ouvriers",
					categoryIndex: 0,
					source: "accord-entreprise",
				},
			],
			// employeeCategories for job-1
			[{ jobCategoryId: "job-1" }],
			// status history: submit
			[{ createdAt: SUBMITTED }],
		);
		const buildPdfData = await importBuild();
		const result = await buildPdfData("123456789", 2026, NOW);

		expect(result.year).toBe(2026);
		expect(result.workforceYear).toBe(2025);
		expect(result.isSecondDeclaration).toBe(false);
		expect(result.referencePeriod).toBe("01/01/2026 - 31/12/2026");
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

	it("displays the GIP-absent placeholder and a bare source when GIP data and label are missing", async () => {
		queue(
			[
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
			[{ siren: "987654321", name: "Autre Démo" }],
			[{ firstName: "Alice", lastName: null, email: null, phone: null }],
			[], // gipMdsData absent
			[
				{
					id: "job-9",
					name: "Cadres",
					categoryIndex: 0,
					source: "convention-maison",
				},
			],
			[{ jobCategoryId: "job-9" }],
			[{ createdAt: SUBMITTED }],
		);
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
		// Unknown source value falls back to its raw string.
		expect(result.source).toBe("convention-maison");
	});

	it("falls back to a synthesized company name and zeroed totals when the company row is missing", async () => {
		queue(
			[
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
			[], // companies missing
			[], // gipMdsData (no declarantId → users query is skipped)
			[], // jobCategories empty
			[{ createdAt: SUBMITTED }], // status history: submit
		);
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
		queue(
			[
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
			[{ siren: "123456789", name: "Société Démo" }],
			[
				{
					firstName: "Jean",
					lastName: "Martin",
					email: "email@example.fr",
					phone: "",
				},
			],
			[{ workforceEma: "120" }],
			[
				{
					id: "job-1",
					name: "Ouvriers",
					categoryIndex: 0,
					source: "accord-groupe",
				},
			],
			[{ jobCategoryId: "job-1" }],
			// resolveTransmittedDate for correction: second_declaration_submit first
			[{ createdAt: SECOND_SUBMIT }],
		);
		const buildPdfData = await importBuild();
		const result = await buildPdfData("123456789", 2026, NOW, "correction");

		expect(result.isSecondDeclaration).toBe(true);
		expect(result.transmittedAt).toBe("05/06/2026");
	});

	it("falls back through submit then updatedAt when no matching status event exists", async () => {
		queue(
			[
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
			[{ siren: "123456789", name: "Société Démo" }],
			[], // gipMdsData
			[], // jobCategories
			// resolveTransmittedDate for correction: second_declaration_submit (empty)
			[],
			// then submit (empty) → falls back to updatedAt
			[],
		);
		const buildPdfData = await importBuild();
		const result = await buildPdfData("123456789", 2026, NOW, "correction");

		expect(result.transmittedAt).toBe("14/02/2026");
	});

	it("falls back to `now` when the declaration has no updatedAt and no submit event", async () => {
		queue(
			[
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
			[{ siren: "123456789", name: "Société Démo" }],
			[], // gipMdsData
			[], // jobCategories
			[], // status history: submit (empty) → falls back to `now`
		);
		const buildPdfData = await importBuild();
		const result = await buildPdfData("123456789", 2026, NOW);

		expect(result.transmittedAt).toBe("09/03/2026");
	});
});
