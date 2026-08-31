import { eq } from "drizzle-orm";
import postgres from "postgres";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";
import {
	buildEmployeeCategoryValues,
	mapToEmployeeCategoryRows,
} from "~/server/api/routers/declarationHelpers";
import { db } from "~/server/db";
import {
	companies,
	declarations,
	employeeCategories,
	jobCategories,
	users,
} from "~/server/db/schema";

/**
 * The hourly headcounts (#4254) are new columns: a unit test mocking the driver
 * would pass whether or not the migration ran. This one writes and reads them
 * through real Postgres.
 */
describe("employee category hourly headcounts (real Postgres)", () => {
	const sql = postgres(env.DATABASE_URL, { max: 1 });

	const SIREN = "987654322";
	const YEAR = 2025;
	const USER_ID = "employee-category-hourly-user";
	const USER_EMAIL = "employee-category-hourly@example.fr";
	const DECLARATION_ID = "employee-category-hourly-declaration";

	async function cleanup() {
		await sql`DELETE FROM app_employee_category WHERE job_category_id IN (SELECT id FROM app_job_category WHERE declaration_id = ${DECLARATION_ID})`;
		await sql`DELETE FROM app_job_category WHERE declaration_id = ${DECLARATION_ID}`;
		await sql`DELETE FROM app_declaration WHERE siren = ${SIREN}`;
		await sql`DELETE FROM app_user_company WHERE user_id = ${USER_ID}`;
		await sql`DELETE FROM app_company WHERE siren = ${SIREN}`;
		await sql`DELETE FROM app_user WHERE id = ${USER_ID}`;
	}

	afterAll(async () => {
		await cleanup();
		await sql.end();
	});

	beforeEach(async () => {
		await cleanup();
		await db.insert(users).values({ id: USER_ID, email: USER_EMAIL });
		await db
			.insert(companies)
			.values({ siren: SIREN, name: "Société Démo horaire" });
		await db.insert(declarations).values({
			id: DECLARATION_ID,
			siren: SIREN,
			year: YEAR,
			declarantId: USER_ID,
			totalWomen: 60,
			totalMen: 40,
			hourlyWomen: 5,
			hourlyMen: 5,
		});
	});

	async function insertCategory(
		name: string,
		categoryIndex: number,
		data: Parameters<typeof buildEmployeeCategoryValues>[2],
	) {
		const [job] = await db
			.insert(jobCategories)
			.values({
				declarationId: DECLARATION_ID,
				categoryIndex,
				name,
				source: "accord-entreprise",
			})
			.returning();
		if (!job) throw new Error("job category not inserted");
		await db
			.insert(employeeCategories)
			.values(buildEmployeeCategoryValues(job.id, "initial", data));
		return job;
	}

	async function readRows() {
		const jobs = await db
			.select()
			.from(jobCategories)
			.where(eq(jobCategories.declarationId, DECLARATION_ID));
		const empCats = await db.select().from(employeeCategories);
		return mapToEmployeeCategoryRows(jobs, empCats, "initial");
	}

	it("persists both headcount bases and reads them back", async () => {
		await insertCategory("Cadres", 0, {
			womenCount: 60,
			menCount: 40,
			hourlyWomenCount: 5,
			hourlyMenCount: 5,
			annualBaseWomen: "30000",
		});

		const rows = await readRows();

		expect(rows).toHaveLength(1);
		expect(rows[0]).toMatchObject({
			name: "Cadres",
			womenCount: 60,
			menCount: 40,
			hourlyWomenCount: 5,
			hourlyMenCount: 5,
		});
	});

	it("reads a category saved before the hourly split with null hourly headcounts", async () => {
		await insertCategory("Employés", 0, { womenCount: 12, menCount: 8 });

		const rows = await readRows();

		expect(rows[0]).toMatchObject({
			womenCount: 12,
			menCount: 8,
			hourlyWomenCount: null,
			hourlyMenCount: null,
		});
	});
});
