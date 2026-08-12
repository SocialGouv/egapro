import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	dbSelect: vi.fn(),
	orReturnsUndefined: false,
}));

vi.mock("~/server/db", () => ({
	db: { select: mocks.dbSelect },
}));

vi.mock("~/server/db/schema", () => ({
	// Read at module scope by projection.ts, which representationProjection.ts
	// imports for isCompanyDiffusible — its columns are irrelevant here.
	declarations: {},
	companies: {
		siren: "c.siren",
		name: "c.name",
		address: "c.address",
		region: "c.region",
		departmentCode: "c.departmentCode",
		departmentLabel: "c.departmentLabel",
		nafCode: "c.nafCode",
		nafLabel: "c.nafLabel",
		statutDiffusion: "c.statutDiffusion",
	},
	representationDeclarations: {
		siren: "rd.siren",
		year: "rd.year",
		status: "rd.status",
		referencePeriodStart: "rd.referencePeriodStart",
		referencePeriodEnd: "rd.referencePeriodEnd",
		executiveWomenPercent: "rd.executiveWomenPercent",
		executiveMenPercent: "rd.executiveMenPercent",
		notComputableReasonExecutives: "rd.notComputableReasonExecutives",
		memberWomenPercent: "rd.memberWomenPercent",
		memberMenPercent: "rd.memberMenPercent",
		notComputableReasonMembers: "rd.notComputableReasonMembers",
		publishDate: "rd.publishDate",
		publishUrl: "rd.publishUrl",
		publishModalities: "rd.publishModalities",
	},
}));

vi.mock("drizzle-orm", () => ({
	and: (...args: unknown[]) => ({
		and: args.filter((arg) => arg !== undefined),
	}),
	count: () => "count(*)",
	desc: (col: unknown) => ({ desc: col }),
	eq: (a: unknown, b: unknown) => ({ eq: [a, b] }),
	ilike: (a: unknown, b: unknown) => ({ ilike: [a, b] }),
	or: (...args: unknown[]) =>
		mocks.orReturnsUndefined ? undefined : { or: args },
}));

const SUBMITTED_ONLY = { eq: ["rd.status", "submitted"] };
const SIREN = "123456789";

type RawRow = Record<string, unknown>;

function makeRawRow(overrides: RawRow = {}): RawRow {
	return {
		year: 2026,
		referencePeriodStart: "2025-01-01",
		referencePeriodEnd: "2025-12-31",
		executiveWomenPercent: "35.50",
		executiveMenPercent: "64.50",
		notComputableReasonExecutives: null,
		memberWomenPercent: "42.00",
		memberMenPercent: "58.00",
		notComputableReasonMembers: null,
		publishDate: "2026-02-15",
		publishUrl: "https://exemple.fr/egalite",
		publishModalities: null,
		siren: SIREN,
		name: "Société Démo",
		address: "1 rue de la Paix, 75002 Paris",
		region: "Île-de-France",
		departmentCode: "75",
		departmentLabel: "Paris",
		nafCode: "62.01Z",
		nafLabel: "Programmation informatique",
		statutDiffusion: "O",
		...overrides,
	};
}

type Captured = {
	rowsWhere?: unknown;
	countWhere?: unknown;
	orderBy?: unknown;
	limit?: number;
	offset?: number;
};

const captured: Captured = {};

function setDb(rows: RawRow[], countRows: RawRow[] = [{ total: rows.length }]) {
	mocks.dbSelect.mockImplementation((selection: Record<string, unknown>) => {
		const isCount = "total" in selection;

		// orderBy() is awaited directly by the by-siren queries and paginated by
		// the search query, so the stub is both a promise and a chain link.
		const orderByResult = Object.assign(Promise.resolve(rows), {
			limit: (value: number) => {
				captured.limit = value;
				return {
					offset: (offsetValue: number) => {
						captured.offset = offsetValue;
						return Promise.resolve(rows);
					},
				};
			},
		});

		const chain = {
			from: () => chain,
			innerJoin: () => chain,
			where: (condition: unknown) => {
				if (isCount) {
					captured.countWhere = condition;
					return Promise.resolve(countRows);
				}
				captured.rowsWhere = condition;
				return chain;
			},
			orderBy: (condition: unknown) => {
				captured.orderBy = condition;
				return orderByResult;
			},
		};

		return chain;
	});
}

async function importService() {
	return import("../representationsBySirenService");
}

beforeEach(() => {
	mocks.dbSelect.mockReset();
	mocks.orReturnsUndefined = false;
	for (const key of Object.keys(captured)) {
		delete captured[key as keyof Captured];
	}
});

describe("searchPublicRepresentations", () => {
	it("returns the projected DTOs and the total count", async () => {
		setDb([makeRawRow()], [{ total: 42 }]);
		const { searchPublicRepresentations } = await importService();

		const result = await searchPublicRepresentations({ limit: 10, offset: 0 });

		expect(result.count).toBe(42);
		expect(result.data).toHaveLength(1);
		expect(result.data[0]).toMatchObject({
			siren: SIREN,
			year: 2026,
			name: "Société Démo",
			executiveWomenPercent: 35.5,
			memberWomenPercent: 42,
		});
	});

	it("restricts the query to submitted declarations when no filter is given", async () => {
		setDb([]);
		const { searchPublicRepresentations } = await importService();

		await searchPublicRepresentations({ limit: 10, offset: 0 });

		expect(captured.rowsWhere).toEqual({ and: [SUBMITTED_ONLY] });
		expect(captured.countWhere).toEqual({ and: [SUBMITTED_ONLY] });
	});

	it("keeps the submitted filter alongside every optional filter", async () => {
		setDb([]);
		const { searchPublicRepresentations } = await importService();

		await searchPublicRepresentations({
			q: "acme",
			region: "Île-de-France",
			departement: "75",
			naf: "62.01Z",
			year: 2026,
			limit: 10,
			offset: 0,
		});

		expect(captured.rowsWhere).toEqual({
			and: [
				SUBMITTED_ONLY,
				{
					or: [
						{ ilike: ["c.name", "%acme%"] },
						{ ilike: ["rd.siren", "%acme%"] },
					],
				},
				{ eq: ["c.region", "Île-de-France"] },
				{ eq: ["c.departmentCode", "75"] },
				{ eq: ["c.nafCode", "62.01Z"] },
				{ eq: ["rd.year", 2026] },
			],
		});
	});

	it("forwards pagination to the query and sorts by descending year", async () => {
		setDb([]);
		const { searchPublicRepresentations } = await importService();

		await searchPublicRepresentations({ limit: 25, offset: 50 });

		expect(captured.limit).toBe(25);
		expect(captured.offset).toBe(50);
		expect(captured.orderBy).toEqual({ desc: "rd.year" });
	});

	it("falls back to a zero count when the count query yields no usable total", async () => {
		const { searchPublicRepresentations } = await importService();

		setDb([], []);
		expect(await searchPublicRepresentations({ limit: 10, offset: 0 })).toEqual(
			{ data: [], count: 0 },
		);

		setDb([], [{ total: undefined }]);
		expect(await searchPublicRepresentations({ limit: 10, offset: 0 })).toEqual(
			{ data: [], count: 0 },
		);
	});

	it("never pushes an undefined text condition into the where clause", async () => {
		// drizzle's or() is typed `SQL | undefined`; a nullish condition slipped
		// into and() would widen the query to every declaration.
		mocks.orReturnsUndefined = true;
		setDb([]);
		const { searchPublicRepresentations } = await importService();

		await searchPublicRepresentations({ q: "acme", limit: 10, offset: 0 });

		expect(captured.rowsWhere).toEqual({ and: [SUBMITTED_ONLY] });
	});

	it("masks the identity of a non-diffusible company in the search results", async () => {
		setDb([makeRawRow({ statutDiffusion: "N" })]);
		const { searchPublicRepresentations } = await importService();

		const result = await searchPublicRepresentations({ limit: 10, offset: 0 });

		expect(result.data[0]).toMatchObject({
			siren: SIREN,
			name: null,
			address: null,
			region: null,
			departmentCode: null,
			departmentLabel: null,
			nafCode: null,
			nafLabel: null,
			executiveWomenPercent: 35.5,
		});
	});
});

describe("getPublicRepresentationsBySiren", () => {
	it("returns every submitted declaration of the siren, most recent first", async () => {
		setDb([makeRawRow({ year: 2026 }), makeRawRow({ year: 2025 })]);
		const { getPublicRepresentationsBySiren } = await importService();

		const result = await getPublicRepresentationsBySiren(SIREN);

		expect(result.map((d) => d.year)).toEqual([2026, 2025]);
		expect(captured.orderBy).toEqual({ desc: "rd.year" });
		expect(captured.rowsWhere).toEqual({
			and: [{ eq: ["rd.siren", SIREN] }, SUBMITTED_ONLY],
		});
	});

	it("applies the optional limit", async () => {
		setDb([
			makeRawRow({ year: 2026 }),
			makeRawRow({ year: 2025 }),
			makeRawRow({ year: 2024 }),
		]);
		const { getPublicRepresentationsBySiren } = await importService();

		const result = await getPublicRepresentationsBySiren(SIREN, 2);

		expect(result.map((d) => d.year)).toEqual([2026, 2025]);
	});

	it("returns an empty array when the siren has no submitted declaration", async () => {
		setDb([]);
		const { getPublicRepresentationsBySiren } = await importService();

		expect(await getPublicRepresentationsBySiren(SIREN)).toEqual([]);
	});
});

describe("getPublicRepresentationBySirenYear", () => {
	it("returns the projected DTO and filters on both siren and year", async () => {
		setDb([makeRawRow({ year: 2026 })]);
		const { getPublicRepresentationBySirenYear } = await importService();

		const result = await getPublicRepresentationBySirenYear(SIREN, 2026);

		expect(result).toMatchObject({ siren: SIREN, year: 2026 });
		expect(captured.rowsWhere).toEqual({
			and: [
				{ eq: ["rd.siren", SIREN] },
				SUBMITTED_ONLY,
				{ eq: ["rd.year", 2026] },
			],
		});
	});

	it("returns null when no submitted declaration matches the year", async () => {
		setDb([]);
		const { getPublicRepresentationBySirenYear } = await importService();

		expect(await getPublicRepresentationBySirenYear(SIREN, 2026)).toBeNull();
	});
});
