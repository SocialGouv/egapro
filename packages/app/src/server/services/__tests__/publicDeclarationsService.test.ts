import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	dbSelect: vi.fn(),
	toPublicDeclaration: vi.fn(),
	or: vi.fn(
		(...args: unknown[]): { op: string; args: unknown[] } | undefined => ({
			op: "or",
			args,
		}),
	),
}));

vi.mock("~/server/db", () => ({
	db: { select: mocks.dbSelect },
}));

vi.mock("~/server/db/schema", () => ({
	declarations: {
		siren: "declarations.siren",
		year: "declarations.year",
		status: "declarations.status",
		cancelledAt: "declarations.cancelledAt",
	},
	companies: {
		siren: "companies.siren",
		name: "companies.name",
		city: "companies.city",
		regionCode: "companies.regionCode",
		region: "companies.region",
		departmentCode: "companies.departmentCode",
		nafCode: "companies.nafCode",
		statutDiffusion: "companies.statutDiffusion",
	},
	campaignDeadlines: {
		year: "campaignDeadlines.year",
		publicDataReleaseDate: "campaignDeadlines.publicDataReleaseDate",
	},
	gipMdsData: {
		siren: "gipMdsData.siren",
		year: "gipMdsData.year",
		workforceEma: "gipMdsData.workforceEma",
	},
}));

vi.mock("drizzle-orm", () => ({
	and: (...args: unknown[]) => ({ op: "and", args: args.filter(Boolean) }),
	asc: (col: unknown) => ({ op: "asc", col }),
	countDistinct: () => ({ op: "countDistinct" }),
	desc: (col: unknown) => ({ op: "desc", col }),
	eq: (col: unknown, value: unknown) => ({ op: "eq", col, value }),
	ilike: (col: unknown, value: unknown) => ({ op: "ilike", col, value }),
	isNotNull: (col: unknown) => ({ op: "isNotNull", col }),
	isNull: (col: unknown) => ({ op: "isNull", col }),
	ne: (col: unknown, value: unknown) => ({ op: "ne", col, value }),
	or: mocks.or,
	sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
		op: "sql",
		strings: [...strings],
		values,
	}),
}));

vi.mock("~/modules/public-api", () => ({
	publicDeclarationColumns: {},
	toPublicDeclaration: mocks.toPublicDeclaration,
}));

const service = () => import("~/server/services/publicDeclarationsService");

type Captured = {
	where?: unknown;
	order?: unknown[];
	limit?: number;
	offset?: number;
};

// Distinguishes the two Promise.all queries by shape: the data query chains
// `.leftJoin().where().limit().offset()`, the count query stops at `.where()`.
function primeDb(rows: unknown[], total: number, captured: Captured) {
	let call = 0;
	mocks.dbSelect.mockImplementation(() => {
		call += 1;
		const chain = {
			from: () => chain,
			innerJoin: () => chain,
			leftJoin: () => chain,
			where: (where: unknown) => {
				if (call === 2) return Promise.resolve([{ total }]);
				captured.where = where;
				return chain;
			},
			orderBy: (...order: unknown[]) => {
				captured.order = order;
				return chain;
			},
			limit: (limit: number) => {
				captured.limit = limit;
				return chain;
			},
			offset: (offset: number) => {
				captured.offset = offset;
				return Promise.resolve(rows);
			},
		};
		return chain;
	});
}

const DEFAULT_INPUT = { limit: 10, offset: 0 } as const;

beforeEach(() => {
	vi.clearAllMocks();
	mocks.toPublicDeclaration.mockReturnValue({ mapped: true });
});

describe("searchPublicDeclarations", () => {
	it("returns mapped data and the total count", async () => {
		const captured: Captured = {};
		primeDb([{ siren: "123456789" }, { siren: "987654321" }], 42, captured);
		const { searchPublicDeclarations } = await service();

		const result = await searchPublicDeclarations(DEFAULT_INPUT);

		expect(result).toEqual({
			data: [{ mapped: true }, { mapped: true }],
			count: 42,
		});
		expect(mocks.toPublicDeclaration).toHaveBeenCalledTimes(2);
	});

	it("defaults the count to 0 when the count query returns no row", async () => {
		const captured: Captured = {};
		primeDb([], 0, captured);
		const { searchPublicDeclarations } = await service();

		const result = await searchPublicDeclarations(DEFAULT_INPUT);

		expect(result).toEqual({ data: [], count: 0 });
		expect(captured.where).toBeDefined();
	});

	it("forwards pagination limit and offset to the data query", async () => {
		const captured: Captured = {};
		primeDb([], 0, captured);
		const { searchPublicDeclarations } = await service();

		await searchPublicDeclarations({ limit: 25, offset: 50 });

		expect(captured.limit).toBe(25);
		expect(captured.offset).toBe(50);
	});

	it("always applies the public-visibility base filters", async () => {
		const captured: Captured = {};
		primeDb([], 0, captured);
		const { searchPublicDeclarations } = await service();

		await searchPublicDeclarations(DEFAULT_INPUT);

		const conditions = (captured.where as { args: Array<{ op: string }> }).args;
		expect(conditions).toContainEqual({
			op: "isNull",
			col: "declarations.cancelledAt",
		});
		expect(conditions).toContainEqual({
			op: "ne",
			col: "declarations.status",
			value: "draft",
		});
		expect(conditions).toContainEqual({
			op: "isNotNull",
			col: "campaignDeadlines.publicDataReleaseDate",
		});
		expect(conditions).toContainEqual(expect.objectContaining({ op: "sql" }));
	});

	it("matches a partial name only for a diffusible company", async () => {
		const captured: Captured = {};
		primeDb([], 0, captured);
		const { searchPublicDeclarations } = await service();

		await searchPublicDeclarations({ ...DEFAULT_INPUT, q: "acme" });

		const conditions = (captured.where as { args: unknown[] }).args;
		expect(conditions).toContainEqual({
			op: "and",
			args: [
				expect.objectContaining({ op: "sql" }),
				{ op: "ilike", col: "companies.name", value: "%acme%" },
			],
		});
	});

	it("matches a SIREN only when the full nine digits are supplied", async () => {
		const captured: Captured = {};
		primeDb([], 0, captured);
		const { searchPublicDeclarations } = await service();

		await searchPublicDeclarations({ ...DEFAULT_INPUT, q: "123 456 789" });

		expect((captured.where as { args: unknown[] }).args).toContainEqual({
			op: "eq",
			col: "declarations.siren",
			value: "123456789",
		});
	});

	it("protects city filtering behind the diffusible identity condition", async () => {
		const captured: Captured = {};
		primeDb([], 0, captured);
		const { searchPublicDeclarations } = await service();

		await searchPublicDeclarations({ ...DEFAULT_INPUT, city: "Paris" });

		expect((captured.where as { args: unknown[] }).args).toContainEqual({
			op: "and",
			args: [
				expect.objectContaining({ op: "sql" }),
				{ op: "ilike", col: "companies.city", value: "%Paris%" },
			],
		});
	});

	it("adds both workforce bounds and a stable SIREN tie-breaker", async () => {
		const captured: Captured = {};
		primeDb([], 0, captured);
		const { searchPublicDeclarations } = await service();

		await searchPublicDeclarations({
			...DEFAULT_INPUT,
			workforceMin: 50,
			workforceMax: 249,
		});

		const conditions = (
			captured.where as { args: Array<{ op: string; values?: unknown[] }> }
		).args;
		expect(conditions).toContainEqual(
			expect.objectContaining({
				op: "sql",
				values: ["gipMdsData.workforceEma", 50],
			}),
		);
		expect(conditions).toContainEqual(
			expect.objectContaining({
				op: "sql",
				values: ["gipMdsData.workforceEma", 249],
			}),
		);
		expect(captured.order).toContainEqual({
			op: "asc",
			col: "companies.siren",
		});
	});

	it("skips the region filter when the OR builder yields no condition", async () => {
		const captured: Captured = {};
		primeDb([], 0, captured);
		mocks.or.mockReturnValueOnce(undefined);
		const { searchPublicDeclarations } = await service();

		await searchPublicDeclarations({ ...DEFAULT_INPUT, region: "11" });

		const conditions = (captured.where as { args: Array<{ op: string }> }).args;
		expect(conditions).toHaveLength(5);
		expect(conditions.some((c) => c.op === "or")).toBe(false);
	});

	it("adds an equality filter on region", async () => {
		const captured: Captured = {};
		primeDb([], 0, captured);
		const { searchPublicDeclarations } = await service();

		await searchPublicDeclarations({
			...DEFAULT_INPUT,
			region: "Île-de-France",
		});

		expect((captured.where as { args: unknown[] }).args).toContainEqual({
			op: "or",
			args: [
				{ op: "eq", col: "companies.regionCode", value: "Île-de-France" },
				{ op: "eq", col: "companies.region", value: "Île-de-France" },
			],
		});
	});

	it("maps departement to the company department code filter", async () => {
		const captured: Captured = {};
		primeDb([], 0, captured);
		const { searchPublicDeclarations } = await service();

		await searchPublicDeclarations({ ...DEFAULT_INPUT, departement: "75" });

		expect((captured.where as { args: unknown[] }).args).toContainEqual({
			op: "eq",
			col: "companies.departmentCode",
			value: "75",
		});
	});

	it("adds an equality filter on naf", async () => {
		const captured: Captured = {};
		primeDb([], 0, captured);
		const { searchPublicDeclarations } = await service();

		await searchPublicDeclarations({ ...DEFAULT_INPUT, naf: "62.01Z" });

		expect((captured.where as { args: unknown[] }).args).toContainEqual({
			op: "ilike",
			col: "companies.nafCode",
			value: "62.01Z%",
		});
	});

	it("adds an equality filter on year", async () => {
		const captured: Captured = {};
		primeDb([], 0, captured);
		const { searchPublicDeclarations } = await service();

		await searchPublicDeclarations({ ...DEFAULT_INPUT, year: 2023 });

		expect((captured.where as { args: unknown[] }).args).toContainEqual({
			op: "eq",
			col: "declarations.year",
			value: 2023,
		});
	});

	it("does not add optional filters when they are absent", async () => {
		const captured: Captured = {};
		primeDb([], 0, captured);
		const { searchPublicDeclarations } = await service();

		await searchPublicDeclarations(DEFAULT_INPUT);

		const conditions = (captured.where as { args: Array<{ op: string }> }).args;
		expect(conditions).toHaveLength(5);
		expect(conditions.some((c) => c.op === "or")).toBe(false);
		expect(conditions.some((c) => c.op === "ilike")).toBe(false);
	});

	it("passes declaration and company source columns to toPublicDeclaration", async () => {
		const captured: Captured = {};
		const row = {
			year: 2023,
			totalWomen: 10,
			totalMen: 20,
			globalAnnualMeanGap: "1.5",
			siren: "123456789",
			name: "Acme",
			address: "1 rue de la Paix",
			region: "11",
			departmentCode: "75",
			departmentLabel: "Paris",
			nafCode: "62.01Z",
			nafLabel: "Programmation",
			workforceEma: "150",
		};
		primeDb([row], 1, captured);
		const { searchPublicDeclarations } = await service();

		await searchPublicDeclarations(DEFAULT_INPUT);

		const [declarationArg, companyArg] =
			mocks.toPublicDeclaration.mock.calls[0] ?? [];
		expect(declarationArg).toMatchObject({
			year: 2023,
			totalWomen: 10,
			totalMen: 20,
			globalAnnualMeanGap: "1.5",
		});
		expect(companyArg).toMatchObject({
			siren: "123456789",
			name: "Acme",
			region: "11",
			departmentCode: "75",
			statutDiffusion: null,
			workforceEma: "150",
		});
	});

	it("coalesces nullable company columns to null before mapping", async () => {
		const captured: Captured = {};
		primeDb(
			[
				{
					siren: "123456789",
					name: "Acme",
					address: undefined,
					region: undefined,
					departmentCode: undefined,
					departmentLabel: undefined,
					nafCode: undefined,
					nafLabel: undefined,
					workforceEma: undefined,
				},
			],
			1,
			captured,
		);
		const { searchPublicDeclarations } = await service();

		await searchPublicDeclarations(DEFAULT_INPUT);

		const [, companyArg] = mocks.toPublicDeclaration.mock.calls[0] ?? [];
		expect(companyArg).toMatchObject({
			address: null,
			region: null,
			departmentCode: null,
			departmentLabel: null,
			nafCode: null,
			nafLabel: null,
			statutDiffusion: null,
			workforceEma: null,
		});
	});
});
