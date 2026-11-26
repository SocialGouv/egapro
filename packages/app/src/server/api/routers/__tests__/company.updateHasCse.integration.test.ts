import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";
import { getCurrentYear } from "~/modules/domain";
import { companyRouter } from "~/server/api/routers/company";
import { db } from "~/server/db";

// The year-scoped write and its lock are SQL-level facts (partial unique index,
// advisory lock, transaction): company.test.ts mocks the driver and cannot see them.
describe("companyRouter.updateHasCse (real Postgres)", () => {
	let sql!: ReturnType<typeof postgres>;

	const SIREN = "700000020";
	const USER_ID = "company-update-has-cse-test-user";
	const USER_EMAIL = "[EMAIL_REDACTED]";
	const YEAR = getCurrentYear();
	const PREVIOUS_YEAR = YEAR - 1;

	function createCaller() {
		return companyRouter.createCaller({
			db,
			session: {
				user: { id: USER_ID, email: USER_EMAIL, isAdmin: false },
				expires: "",
			},
			headers: new Headers(),
		} as never);
	}

	async function cleanup() {
		await sql`DELETE FROM app_declaration WHERE siren = ${SIREN}`;
		await sql`DELETE FROM app_gip_mds_data WHERE siren = ${SIREN}`;
		await sql`DELETE FROM app_user_company WHERE user_id = ${USER_ID}`;
		await sql`DELETE FROM app_company WHERE siren = ${SIREN}`;
		await sql`DELETE FROM app_user WHERE id = ${USER_ID}`;
	}

	async function readAnswers() {
		const [company] = await sql<{ has_cse: boolean | null }[]>`
			SELECT has_cse FROM app_company WHERE siren = ${SIREN}
		`;
		const declarations = await sql<
			{ year: number; has_cse: boolean | null; cse_required: boolean }[]
		>`
			SELECT year, has_cse, cse_required
			FROM app_declaration
			WHERE siren = ${SIREN}
			ORDER BY year
		`;
		return { companyHasCse: company?.has_cse ?? null, declarations };
	}

	beforeAll(() => {
		sql = postgres(env.DATABASE_URL, { max: 1 });
	});

	afterAll(async () => {
		if (!sql) return;
		await cleanup();
		await sql.end();
	});

	beforeEach(async () => {
		await cleanup();
		await sql`INSERT INTO app_user (id, email) VALUES (${USER_ID}, ${USER_EMAIL})`;
		await sql`
			INSERT INTO app_company (siren, name, has_cse)
			VALUES (${SIREN}, 'Société Démo', true)
		`;
		await sql`INSERT INTO app_user_company (user_id, siren) VALUES (${USER_ID}, ${SIREN})`;
		await sql`
			INSERT INTO app_gip_mds_data (siren, year, workforce_ema)
			VALUES (${SIREN}, ${YEAR}, 250.00)
		`;
	});

	it("freezes the answer once the year's démarche is completed", async () => {
		await sql`
			INSERT INTO app_declaration
				(id, siren, year, declarant_id, status, has_cse, cse_required, current_step)
			VALUES
				('update-has-cse-completed', ${SIREN}, ${YEAR}, ${USER_ID}, 'demarche_completed', true, true, 6)
		`;

		await expect(
			createCaller().updateHasCse({ siren: SIREN, hasCse: false }),
		).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });

		const { companyHasCse, declarations } = await readAnswers();
		expect(companyHasCse).toBe(true);
		expect(declarations).toEqual([
			{ year: YEAR, has_cse: true, cse_required: true },
		]);
	});

	it("writes the answer on the company and on the open year only", async () => {
		await sql`
			INSERT INTO app_declaration
				(id, siren, year, declarant_id, status, has_cse, cse_required, current_step)
			VALUES
				('update-has-cse-previous', ${SIREN}, ${PREVIOUS_YEAR}, ${USER_ID}, 'demarche_completed', true, true, 6),
				('update-has-cse-current', ${SIREN}, ${YEAR}, ${USER_ID}, 'draft', true, true, 3)
		`;

		await createCaller().updateHasCse({ siren: SIREN, hasCse: false });

		const { companyHasCse, declarations } = await readAnswers();
		expect(companyHasCse).toBe(false);
		expect(declarations).toEqual([
			{ year: PREVIOUS_YEAR, has_cse: true, cse_required: true },
			{ year: YEAR, has_cse: false, cse_required: false },
		]);
	});

	it("still writes the company when no démarche exists for the year", async () => {
		await createCaller().updateHasCse({ siren: SIREN, hasCse: false });

		const { companyHasCse, declarations } = await readAnswers();
		expect(companyHasCse).toBe(false);
		expect(declarations).toEqual([]);
	});
});
