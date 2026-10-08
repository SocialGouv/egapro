import ExcelJS from "exceljs";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { env } from "~/env.js";
import { db } from "~/server/db";
import {
	campaignDeadlines,
	companies,
	declarations,
	users,
} from "~/server/db/schema";

const DECLARANT_ID = "export-route-declarant";
const SIREN = "800000101";
const YEAR = 2110;

async function cleanup(sql: ReturnType<typeof postgres>) {
	await sql`DELETE FROM app_declaration WHERE siren = ${SIREN}`;
	await sql`DELETE FROM app_company WHERE siren = ${SIREN}`;
	await sql`DELETE FROM app_user WHERE id = ${DECLARANT_ID}`;
	await sql`DELETE FROM app_campaign_deadline WHERE year = ${YEAR}`;
}

async function callGet(search: string) {
	const { GET } = await import("../route");
	return GET(
		new Request(`http://localhost/api/public/declarations/export${search}`),
	);
}

// The probe and the full export share one dynamic Drizzle query: only a real Postgres proves the SQL.
describe("GET /api/public/declarations/export (real Postgres)", () => {
	let sql!: ReturnType<typeof postgres>;

	beforeAll(async () => {
		sql = postgres(env.DATABASE_URL, { max: 1 });
		await cleanup(sql);
		const filler = "2000-01-01";
		await db.insert(users).values({
			id: DECLARANT_ID,
			email: "declarant@example.fr",
		});
		await db.insert(companies).values({
			siren: SIREN,
			name: "Société Démo",
			address: "1 rue de la Paix, 75002 Paris",
			city: "Paris",
		});
		await db.insert(campaignDeadlines).values({
			year: YEAR,
			publicDataReleaseDate: filler,
			decl1ModificationDeadline: filler,
			decl1JustificationDeadline: filler,
			decl1JointEvaluationDeadline: filler,
			decl2ModificationDeadline: filler,
			decl2JustificationDeadline: filler,
			decl2JointEvaluationDeadline: filler,
			decl2CseOpinionDeadline: filler,
		});
		await db.insert(declarations).values({
			id: "export-route-declaration",
			siren: SIREN,
			year: YEAR,
			declarantId: DECLARANT_ID,
			status: "demarche_completed",
			globalAnnualMeanGap: "-0.0242",
		});
	});

	afterAll(async () => {
		if (!sql) return;
		await cleanup(sql);
		await sql.end();
	});

	it("probes then builds a filtered Excel workbook", async () => {
		const response = await callGet(`?format=xlsx&q=${SIREN}`);

		expect(response.status).toBe(200);
		const workbook = new ExcelJS.Workbook();
		await workbook.xlsx.load(await response.arrayBuffer());
		const sheet = workbook.getWorksheet("Indicateurs A-F");
		expect(sheet?.getRow(2).getCell(2).value).toBe(SIREN);
	});

	it("publishes a filtered CSV with its negative gap kept numeric", async () => {
		const response = await callGet(`?format=csv&q=${SIREN}`);
		const [header, line] = (await response.text()).split("\n");
		const columns = header?.split(";") ?? [];

		expect(line?.split(";")[columns.indexOf('"globalAnnualMeanGap"')]).toBe(
			'"-0.0242"',
		);
	});

	it("reads a `_` search as a literal underscore", async () => {
		const response = await callGet("?format=csv&q=_");

		expect(await response.text()).not.toContain(SIREN);
	});
});
