import { eq, inArray } from "drizzle-orm";
import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";
import { db } from "~/server/db";
import { companies } from "~/server/db/schema";

describe("app_company region/department/country persistence (real Postgres)", () => {
	let sql!: ReturnType<typeof postgres>;

	const SIREN_DIFFUSIBLE = "700000001";
	const SIREN_NON_DIFFUSIBLE = "700000002";
	const SIREN_ETRANGER = "700000003";
	const SIRENS = [SIREN_DIFFUSIBLE, SIREN_NON_DIFFUSIBLE, SIREN_ETRANGER];

	async function cleanup() {
		await sql`DELETE FROM app_company WHERE siren IN ${sql(SIRENS)}`;
	}

	beforeAll(() => {
		sql = postgres(env.DATABASE_URL, { max: 1 });
	});

	afterAll(async () => {
		if (!sql) return;
		await cleanup();
		await sql.end();
	});

	beforeEach(cleanup);

	it("persists and reads back region, department code and label", async () => {
		await db.insert(companies).values({
			siren: SIREN_DIFFUSIBLE,
			name: "Alpha Solutions",
			address: "12 RUE DES INNOVATEURS, 75011 PARIS",
			region: "Île-de-France",
			departmentCode: "75",
			departmentLabel: "Paris",
		});

		const [row] = await db
			.select()
			.from(companies)
			.where(eq(companies.siren, SIREN_DIFFUSIBLE));

		expect(row).toMatchObject({
			region: "Île-de-France",
			departmentCode: "75",
			departmentLabel: "Paris",
		});
	});

	it("maps the camelCase columns to their snake_case physical columns", async () => {
		await db.insert(companies).values({
			siren: SIREN_DIFFUSIBLE,
			name: "Alpha Solutions",
			region: "Nouvelle-Aquitaine",
			departmentCode: "33",
			departmentLabel: "Gironde",
			countryCode: null,
			countryLabel: "FRANCE",
		});

		const [raw] = await sql`
			SELECT region, department_code, department_label, country_code, country_label
			FROM app_company
			WHERE siren = ${SIREN_DIFFUSIBLE}
		`;

		expect(raw).toEqual({
			region: "Nouvelle-Aquitaine",
			department_code: "33",
			department_label: "Gironde",
			country_code: null,
			country_label: "FRANCE",
		});
	});

	it("round-trips a foreign country on its own columns (S5)", async () => {
		await db.insert(companies).values({
			siren: SIREN_ETRANGER,
			name: "Gamma Holding",
			countryCode: "99248",
			countryLabel: "QATAR",
		});

		const [row] = await db
			.select()
			.from(companies)
			.where(eq(companies.siren, SIREN_ETRANGER));

		expect(row).toMatchObject({
			region: null,
			departmentCode: null,
			countryCode: "99248",
			countryLabel: "QATAR",
		});
	});

	it("upserts the country on conflict, replacing an unknown by a resolved one (S5)", async () => {
		await db.insert(companies).values({
			siren: SIREN_ETRANGER,
			name: "Gamma Holding",
		});

		const enriched = {
			siren: SIREN_ETRANGER,
			name: "Gamma Holding",
			countryCode: "99248",
			countryLabel: "QATAR",
		};
		await db
			.insert(companies)
			.values(enriched)
			.onConflictDoUpdate({
				target: companies.siren,
				set: { ...enriched, updatedAt: new Date() },
			});

		const [row] = await db
			.select()
			.from(companies)
			.where(eq(companies.siren, SIREN_ETRANGER));

		expect(row).toMatchObject({
			countryCode: "99248",
			countryLabel: "QATAR",
		});
	});

	it("keeps the country filled while address is null (non-diffusible, S4)", async () => {
		await db.insert(companies).values({
			siren: SIREN_NON_DIFFUSIBLE,
			name: "Entreprise non diffusible",
			address: null,
			departmentCode: "33",
			countryLabel: "FRANCE",
		});

		const [row] = await db
			.select()
			.from(companies)
			.where(eq(companies.siren, SIREN_NON_DIFFUSIBLE));

		expect(row?.address).toBeNull();
		expect(row).toMatchObject({ countryCode: null, countryLabel: "FRANCE" });
	});

	it("keeps France and unknown apart on the tri-state columns (S6)", async () => {
		// The backfill of migration 0050 labels FRANCE only where a department
		// proves the row French. Replayed here on two fresh rows: a blanket
		// UPDATE would stamp FRANCE onto the foreign row too.
		await db.insert(companies).values([
			{
				siren: SIREN_DIFFUSIBLE,
				name: "Alpha Solutions",
				departmentCode: "75",
			},
			{ siren: SIREN_ETRANGER, name: "Gamma Holding", departmentCode: null },
		]);

		await sql`
			UPDATE app_company
			SET country_label = 'FRANCE'
			WHERE department_code IS NOT NULL
				AND country_label IS NULL
				AND siren IN ${sql(SIRENS)}
		`;

		const rows = await db
			.select()
			.from(companies)
			.where(inArray(companies.siren, [SIREN_DIFFUSIBLE, SIREN_ETRANGER]));
		const bySiren = new Map(rows.map((r) => [r.siren, r]));

		expect(bySiren.get(SIREN_DIFFUSIBLE)).toMatchObject({
			countryCode: null,
			countryLabel: "FRANCE",
		});
		expect(bySiren.get(SIREN_ETRANGER)).toMatchObject({
			countryCode: null,
			countryLabel: null,
		});
	});

	it("keeps region/department filled while address is null (non-diffusible, S5)", async () => {
		await db.insert(companies).values({
			siren: SIREN_NON_DIFFUSIBLE,
			name: "Entreprise non diffusible",
			address: null,
			region: "Nouvelle-Aquitaine",
			departmentCode: "33",
			departmentLabel: "Gironde",
		});

		const [row] = await db
			.select()
			.from(companies)
			.where(eq(companies.siren, SIREN_NON_DIFFUSIBLE));

		expect(row?.address).toBeNull();
		expect(row).toMatchObject({
			region: "Nouvelle-Aquitaine",
			departmentCode: "33",
			departmentLabel: "Gironde",
		});
	});

	it("upserts the location columns on conflict (at-login persistence path)", async () => {
		await db.insert(companies).values({
			siren: SIREN_DIFFUSIBLE,
			name: "Alpha Solutions",
		});

		const enriched = {
			siren: SIREN_DIFFUSIBLE,
			name: "Alpha Solutions",
			region: "Auvergne-Rhône-Alpes",
			departmentCode: "69",
			departmentLabel: "Rhône",
		};
		await db
			.insert(companies)
			.values(enriched)
			.onConflictDoUpdate({
				target: companies.siren,
				set: { ...enriched, updatedAt: new Date() },
			});

		const [row] = await db
			.select()
			.from(companies)
			.where(eq(companies.siren, SIREN_DIFFUSIBLE));

		expect(row).toMatchObject({
			region: "Auvergne-Rhône-Alpes",
			departmentCode: "69",
			departmentLabel: "Rhône",
		});
	});

	it("defaults the location columns to null when unset", async () => {
		await db.insert(companies).values({
			siren: SIREN_DIFFUSIBLE,
			name: "Legacy Company",
		});

		const [row] = await db
			.select()
			.from(companies)
			.where(eq(companies.siren, SIREN_DIFFUSIBLE));

		expect(row).toMatchObject({
			region: null,
			departmentCode: null,
			departmentLabel: null,
			countryCode: null,
			countryLabel: null,
		});
	});
});
