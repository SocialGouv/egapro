import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";
import { db } from "~/server/db";
import {
	campaignDeadlines,
	companies,
	declarations,
	gipMdsData,
	users,
} from "~/server/db/schema";
import { searchPublicDeclarations } from "~/server/services/publicDeclarationsService";

const DECLARANT_ID = "pub-decl-declarant";
const SIREN_A = "800000001";
const SIREN_B = "800000002";
const SIREN_C = "800000003";
const SIRENS = [SIREN_A, SIREN_B, SIREN_C];

// Past = releasable, future = still embargoed.
const PAST_RELEASE = "2000-01-01";
const FUTURE_RELEASE = "2999-01-01";

type CampaignYear = { year: number; publicDataReleaseDate: string | null };

function campaignRow({ year, publicDataReleaseDate }: CampaignYear) {
	// The NOT NULL deadline columns are irrelevant to the search but required.
	const filler = "2000-01-01";
	return {
		year,
		publicDataReleaseDate,
		decl1ModificationDeadline: filler,
		decl1JustificationDeadline: filler,
		decl1JointEvaluationDeadline: filler,
		decl2ModificationDeadline: filler,
		decl2JustificationDeadline: filler,
		decl2JointEvaluationDeadline: filler,
	};
}

type DeclarationRow = {
	siren: string;
	year: number;
	status?: "draft" | "demarche_completed";
	cancelledAt?: Date | null;
	globalAnnualMeanGap?: string | null;
};

function declarationRow({
	siren,
	year,
	status = "demarche_completed",
	cancelledAt = null,
	globalAnnualMeanGap = null,
}: DeclarationRow) {
	return {
		id: `${siren}-${year}-${status}-${cancelledAt ? "cancelled" : "active"}`,
		siren,
		year,
		declarantId: DECLARANT_ID,
		status,
		cancelledAt,
		globalAnnualMeanGap,
	};
}

async function cleanup(sql: ReturnType<typeof postgres>) {
	await sql`DELETE FROM app_gip_mds_data WHERE siren IN ${sql(SIRENS)}`;
	await sql`DELETE FROM app_declaration WHERE siren IN ${sql(SIRENS)}`;
	await sql`DELETE FROM app_company WHERE siren IN ${sql(SIRENS)}`;
	await sql`DELETE FROM app_user WHERE id = ${DECLARANT_ID}`;
	await sql`DELETE FROM app_campaign_deadline WHERE year IN (2100, 2101, 2102)`;
}

describe("searchPublicDeclarations (real Postgres)", () => {
	let sql!: ReturnType<typeof postgres>;

	beforeAll(async () => {
		sql = postgres(env.DATABASE_URL, { max: 1 });
		await cleanup(sql);
		await db.insert(users).values({
			id: DECLARANT_ID,
			email: "declarant@example.fr",
		});
		await db.insert(companies).values([
			{
				siren: SIREN_A,
				name: "Alpha Industries",
				address: "1 rue Alpha",
				region: "11",
				departmentCode: "75",
				departmentLabel: "Paris",
				nafCode: "62.01Z",
				nafLabel: "Programmation",
			},
			{
				siren: SIREN_B,
				name: "Beta Corp",
				region: "84",
				departmentCode: "69",
				nafCode: "70.10Z",
			},
			{
				siren: SIREN_C,
				name: "Gamma SA",
				region: "11",
				departmentCode: "92",
				nafCode: "62.01Z",
			},
		]);
		await db
			.insert(campaignDeadlines)
			.values([
				campaignRow({ year: 2100, publicDataReleaseDate: PAST_RELEASE }),
				campaignRow({ year: 2101, publicDataReleaseDate: FUTURE_RELEASE }),
				campaignRow({ year: 2102, publicDataReleaseDate: null }),
			]);
	});

	afterAll(async () => {
		if (!sql) return;
		await cleanup(sql);
		await sql.end();
	});

	beforeEach(async () => {
		await sql`DELETE FROM app_gip_mds_data WHERE siren IN ${sql(SIRENS)}`;
		await sql`DELETE FROM app_declaration WHERE siren IN ${sql(SIRENS)}`;
	});

	it("returns only released, non-draft, non-cancelled declarations", async () => {
		await db
			.insert(declarations)
			.values([
				declarationRow({ siren: SIREN_A, year: 2100 }),
				declarationRow({ siren: SIREN_B, year: 2100, status: "draft" }),
				declarationRow({ siren: SIREN_C, year: 2101 }),
			]);

		const result = await searchPublicDeclarations({ limit: 10, offset: 0 });

		expect(result.count).toBe(1);
		expect(result.data).toHaveLength(1);
		expect(result.data[0]?.siren).toBe(SIREN_A);
	});

	it("excludes years whose public release date has not been reached", async () => {
		await db
			.insert(declarations)
			.values([
				declarationRow({ siren: SIREN_A, year: 2101 }),
				declarationRow({ siren: SIREN_B, year: 2102 }),
			]);

		const result = await searchPublicDeclarations({ limit: 10, offset: 0 });

		expect(result.count).toBe(0);
		expect(result.data).toEqual([]);
	});

	it("excludes cancelled declarations even when released and submitted", async () => {
		await db.insert(declarations).values([
			declarationRow({ siren: SIREN_A, year: 2100 }),
			declarationRow({
				siren: SIREN_B,
				year: 2100,
				cancelledAt: new Date("2100-06-01"),
			}),
		]);

		const result = await searchPublicDeclarations({ limit: 10, offset: 0 });

		expect(result.count).toBe(1);
		expect(result.data[0]?.siren).toBe(SIREN_A);
	});

	it("matches the q term against company name and siren, case-insensitively", async () => {
		await db
			.insert(declarations)
			.values([
				declarationRow({ siren: SIREN_A, year: 2100 }),
				declarationRow({ siren: SIREN_B, year: 2100 }),
				declarationRow({ siren: SIREN_C, year: 2100 }),
			]);

		const byName = await searchPublicDeclarations({
			q: "alpha",
			limit: 10,
			offset: 0,
		});
		expect(byName.data.map((d) => d.siren)).toEqual([SIREN_A]);

		const bySiren = await searchPublicDeclarations({
			q: SIREN_B,
			limit: 10,
			offset: 0,
		});
		expect(bySiren.data.map((d) => d.siren)).toEqual([SIREN_B]);
	});

	it("filters by region, department, naf and year", async () => {
		await db
			.insert(declarations)
			.values([
				declarationRow({ siren: SIREN_A, year: 2100 }),
				declarationRow({ siren: SIREN_B, year: 2100 }),
				declarationRow({ siren: SIREN_C, year: 2100 }),
			]);

		const byRegion = await searchPublicDeclarations({
			region: "11",
			limit: 10,
			offset: 0,
		});
		expect(byRegion.data.map((d) => d.siren).sort()).toEqual([
			SIREN_A,
			SIREN_C,
		]);

		const byDepartement = await searchPublicDeclarations({
			departement: "69",
			limit: 10,
			offset: 0,
		});
		expect(byDepartement.data.map((d) => d.siren)).toEqual([SIREN_B]);

		const byNaf = await searchPublicDeclarations({
			naf: "70.10Z",
			limit: 10,
			offset: 0,
		});
		expect(byNaf.data.map((d) => d.siren)).toEqual([SIREN_B]);

		const byYear = await searchPublicDeclarations({
			year: 2100,
			limit: 10,
			offset: 0,
		});
		expect(byYear.count).toBe(3);
	});

	it("paginates with limit and offset while keeping the full count", async () => {
		await db
			.insert(declarations)
			.values([
				declarationRow({ siren: SIREN_A, year: 2100 }),
				declarationRow({ siren: SIREN_B, year: 2100 }),
				declarationRow({ siren: SIREN_C, year: 2100 }),
			]);

		const firstPage = await searchPublicDeclarations({ limit: 2, offset: 0 });
		expect(firstPage.count).toBe(3);
		expect(firstPage.data).toHaveLength(2);

		const secondPage = await searchPublicDeclarations({ limit: 2, offset: 2 });
		expect(secondPage.count).toBe(3);
		expect(secondPage.data).toHaveLength(1);
	});

	it("left-joins gip workforce and coerces numeric gap columns to numbers", async () => {
		await db.insert(declarations).values([
			declarationRow({
				siren: SIREN_A,
				year: 2100,
				globalAnnualMeanGap: "3.5",
			}),
		]);
		await db.insert(gipMdsData).values({
			siren: SIREN_A,
			year: 2100,
			workforceEma: "150.00",
		});

		const result = await searchPublicDeclarations({ limit: 10, offset: 0 });

		expect(result.data[0]).toMatchObject({
			siren: SIREN_A,
			name: "Alpha Industries",
			globalAnnualMeanGap: 3.5,
			workforceEma: 150,
		});
	});

	it("keeps declarations with no gip row (left join yields null workforce)", async () => {
		await db
			.insert(declarations)
			.values([declarationRow({ siren: SIREN_A, year: 2100 })]);

		const result = await searchPublicDeclarations({ limit: 10, offset: 0 });

		expect(result.count).toBe(1);
		expect(result.data[0]?.workforceEma).toBeNull();
	});
});
