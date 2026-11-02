import { beforeEach, describe, expect, it, vi } from "vitest";

import { REPRESENTATION_CAMPAIGN_YEAR_OFFSET } from "~/modules/domain";

const mocks = vi.hoisted(() => ({
	dbSelect: vi.fn(),
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
		regionCode: "c.regionCode",
		region: "c.region",
		departmentCode: "c.departmentCode",
		departmentLabel: "c.departmentLabel",
		nafCode: "c.nafCode",
		nafLabel: "c.nafLabel",
		statutDiffusion: "c.statutDiffusion",
	},
	campaignDeadlines: {
		year: "cd.year",
		publicDataReleaseDate: "cd.publicDataReleaseDate",
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
	desc: (col: unknown) => ({ desc: col }),
	eq: (a: unknown, b: unknown) => ({ eq: [a, b] }),
	sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({
		sql: strings.join(""),
		values,
	}),
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

type Join = [table: unknown, condition: unknown];

type Captured = {
	rowsWhere?: unknown;
	rowsJoins?: Join[];
	orderBy?: unknown[];
};

const captured: Captured = {};

function setDb(rows: RawRow[]) {
	mocks.dbSelect.mockImplementation(() => {
		const joins: Join[] = [];
		captured.rowsJoins = joins;

		const chain = {
			from: () => chain,
			innerJoin: (table: unknown, condition: unknown) => {
				joins.push([table, condition]);
				return chain;
			},
			where: (condition: unknown) => {
				captured.rowsWhere = condition;
				return chain;
			},
			orderBy: (...conditions: unknown[]) => {
				captured.orderBy = conditions;
				return Promise.resolve(rows);
			},
		};

		return chain;
	});
}

type SqlNode = { sql: string; values: unknown[] };

function expectPublicationJoin(joins: Join[] | undefined) {
	const join = joins?.find(
		([table]) => (table as { year?: string })?.year === "cd.year",
	);
	expect(join).toBeDefined();

	const condition = join?.[1] as SqlNode;
	expect(condition.values.slice(0, 2)).toEqual(["cd.year", "rd.year"]);
	expect(condition.values[2]).toBe(REPRESENTATION_CAMPAIGN_YEAR_OFFSET);

	const release = condition.values[3] as SqlNode;
	expect(release.sql).toContain("IS NOT NULL");
	expect(release.sql.toLowerCase()).toContain("at time zone 'europe/paris'");
	expect(release.sql).toContain("::date");
	expect(release.values).toEqual([
		"cd.publicDataReleaseDate",
		"cd.publicDataReleaseDate",
	]);
}

async function importService() {
	return import("../representationsBySirenService");
}

beforeEach(() => {
	mocks.dbSelect.mockReset();
	for (const key of Object.keys(captured)) {
		delete captured[key as keyof Captured];
	}
});

describe("getPublicRepresentationsBySiren", () => {
	it("returns every submitted declaration of the siren, most recent first", async () => {
		setDb([makeRawRow({ year: 2026 }), makeRawRow({ year: 2025 })]);
		const { getPublicRepresentationsBySiren } = await importService();

		const result = await getPublicRepresentationsBySiren(SIREN);

		expect(result.map((d) => d.year)).toEqual([2026, 2025]);
		expect(captured.orderBy).toEqual([{ desc: "rd.year" }]);
		expect(captured.rowsWhere).toEqual({
			and: [{ eq: ["rd.siren", SIREN] }, SUBMITTED_ONLY],
		});
	});

	it("gates the history on the published campaign", async () => {
		setDb([]);
		const { getPublicRepresentationsBySiren } = await importService();

		await getPublicRepresentationsBySiren(SIREN);

		expectPublicationJoin(captured.rowsJoins);
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

	it("projects the raw columns into the public DTO", async () => {
		setDb([makeRawRow()]);
		const { getPublicRepresentationsBySiren } = await importService();

		const [result] = await getPublicRepresentationsBySiren(SIREN);

		expect(result).toMatchObject({
			siren: SIREN,
			year: 2026,
			name: "Société Démo",
			executiveWomenPercent: 35.5,
			memberWomenPercent: 42,
		});
	});

	it("masks the identity of a non-diffusible company", async () => {
		setDb([makeRawRow({ statutDiffusion: "N" })]);
		const { getPublicRepresentationsBySiren } = await importService();

		const [result] = await getPublicRepresentationsBySiren(SIREN);

		expect(result).toMatchObject({
			siren: SIREN,
			name: "Non-diffusible",
			address: "Non-diffusible",
			region: "Non-diffusible",
			departmentCode: "Non-diffusible",
			departmentLabel: "Non-diffusible",
			nafCode: "Non-diffusible",
			nafLabel: "Non-diffusible",
			executiveWomenPercent: 35.5,
		});
	});
});
