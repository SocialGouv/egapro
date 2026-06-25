import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";
import { adminStatsRouter } from "~/server/api/routers/adminStats";
import { db } from "~/server/db";

describe("adminStatsRouter.getUsersPerCompany (real Postgres)", () => {
	let sql!: ReturnType<typeof postgres>;

	const SIREN_MONO = "111111111";
	const SIREN_DUO = "222222222";
	const SIREN_QUAD = "333333333";
	const SIRENS = [SIREN_MONO, SIREN_DUO, SIREN_QUAD];
	const USER_PREFIX = "upc-int-";

	// mono: 1 user · duo: 2 users · quad: 4 users → 7 distinct users.
	const SEED: Array<{ siren: string; users: string[] }> = [
		{ siren: SIREN_MONO, users: [`${USER_PREFIX}a1`] },
		{ siren: SIREN_DUO, users: [`${USER_PREFIX}b1`, `${USER_PREFIX}b2`] },
		{
			siren: SIREN_QUAD,
			users: [
				`${USER_PREFIX}c1`,
				`${USER_PREFIX}c2`,
				`${USER_PREFIX}c3`,
				`${USER_PREFIX}c4`,
			],
		},
	];

	function createCaller() {
		return adminStatsRouter.createCaller({
			db,
			session: {
				user: {
					id: `${USER_PREFIX}admin`,
					email: "upc-int-admin@example.fr",
					siret: `${SIREN_MONO}00015`,
					isAdmin: true,
					impersonation: null,
				},
				expires: "",
			},
			headers: new Headers(),
		} as never);
	}

	// The KPI aggregates the whole `app_user_company` table, so the test must own
	// it exclusively. The integration suite is serial (fileParallelism:false) and
	// every other file re-seeds its own data in beforeEach.
	async function cleanup() {
		await sql`DELETE FROM app_user_company`;
		await sql`DELETE FROM app_company WHERE siren IN ${sql(SIRENS)}`;
		await sql`DELETE FROM app_user WHERE id LIKE ${`${USER_PREFIX}%`}`;
	}

	async function seed() {
		for (const { siren, users } of SEED) {
			await sql`INSERT INTO app_company (siren, name) VALUES (${siren}, ${`Company ${siren}`})`;
			for (const userId of users) {
				await sql`INSERT INTO app_user (id, email) VALUES (${userId}, ${`${userId}@example.fr`})`;
				await sql`INSERT INTO app_user_company (user_id, siren) VALUES (${userId}, ${siren})`;
			}
		}
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

	it("returns the mono/multi distribution, average and max from user_company", async () => {
		await seed();

		const result = await createCaller().getUsersPerCompany();

		expect(result).toEqual({
			totalCompanies: 3,
			mono: 1,
			multi: 2,
			avgPerCompany: expect.closeTo(2.3333, 3),
			maxUsers: 4,
		});
	});

	it("returns all zeros when no user is linked to any company", async () => {
		const result = await createCaller().getUsersPerCompany();

		expect(result).toEqual({
			totalCompanies: 0,
			mono: 0,
			multi: 0,
			avgPerCompany: 0,
			maxUsers: 0,
		});
	});
});
