import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";
import { companyRouter } from "~/server/api/routers/company";
import { db } from "~/server/db";

// company.test.ts mocks the driver, so a column dropped from the select() would pass it silently.
describe("companyRouter.get country projection (real Postgres)", () => {
	let sql!: ReturnType<typeof postgres>;

	const SIREN_FOREIGN = "700000010";
	const SIREN_FRENCH = "700000011";
	const SIREN_UNKNOWN = "700000012";
	const SIRENS = [SIREN_FOREIGN, SIREN_FRENCH, SIREN_UNKNOWN];
	const USER_ID = "company-get-integration-test-user";
	const USER_EMAIL = "company-get-integration@example.fr";

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
		await sql`DELETE FROM app_user_company WHERE user_id = ${USER_ID}`;
		await sql`DELETE FROM app_company WHERE siren IN ${sql(SIRENS)}`;
		await sql`DELETE FROM app_user WHERE id = ${USER_ID}`;
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
	});

	it("returns countryCode and countryLabel for a known foreign country", async () => {
		await sql`
			INSERT INTO app_company (siren, name, country_code, country_label)
			VALUES (${SIREN_FOREIGN}, 'Gamma Holding', '99248', 'QATAR')
		`;
		await sql`INSERT INTO app_user_company (user_id, siren) VALUES (${USER_ID}, ${SIREN_FOREIGN})`;

		const result = await createCaller().get({ siren: SIREN_FOREIGN });

		expect(result.countryCode).toBe("99248");
		expect(result.countryLabel).toBe("QATAR");
	});

	it("returns countryCode null and countryLabel FRANCE for a French company", async () => {
		await sql`
			INSERT INTO app_company (siren, name, country_label)
			VALUES (${SIREN_FRENCH}, 'Alpha Solutions', 'FRANCE')
		`;
		await sql`INSERT INTO app_user_company (user_id, siren) VALUES (${USER_ID}, ${SIREN_FRENCH})`;

		const result = await createCaller().get({ siren: SIREN_FRENCH });

		expect(result.countryCode).toBeNull();
		expect(result.countryLabel).toBe("FRANCE");
	});

	it("returns both country fields null when unresolved", async () => {
		await sql`INSERT INTO app_company (siren, name) VALUES (${SIREN_UNKNOWN}, 'Delta Inc')`;
		await sql`INSERT INTO app_user_company (user_id, siren) VALUES (${USER_ID}, ${SIREN_UNKNOWN})`;

		const result = await createCaller().get({ siren: SIREN_UNKNOWN });

		expect(result.countryCode).toBeNull();
		expect(result.countryLabel).toBeNull();
	});
});
