import { eq } from "drizzle-orm";
import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";
import { db } from "~/server/db";
import { companies } from "~/server/db/schema";

describe("app_company region/department persistence (real Postgres)", () => {
	let sql!: ReturnType<typeof postgres>;

	const SIREN_DIFFUSIBLE = "700000001";
	const SIREN_NON_DIFFUSIBLE = "700000002";
	const SIRENS = [SIREN_DIFFUSIBLE, SIREN_NON_DIFFUSIBLE];

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
		});

		const [raw] = await sql`
			SELECT region, department_code, department_label
			FROM app_company
			WHERE siren = ${SIREN_DIFFUSIBLE}
		`;

		expect(raw).toEqual({
			region: "Nouvelle-Aquitaine",
			department_code: "33",
			department_label: "Gironde",
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
		});
	});
});
