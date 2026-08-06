import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { TEST_SIREN } from "~/e2e/constants";
import { resetCampaignYear } from "~/e2e/helpers/db-campaign";

// Runnable proof of the #4067 isolation guarantee (ticket criterion 4).
//
// `resetCampaignYear(year)` is the DB core of the campaign-year grid (#4022): it
// must wipe EVERY year-scoped row of one (siren, year) coordinate — declaration,
// its dependents, the declaration lock, GIP data and the campaign deadline — while
// leaving a DIFFERENT year's coordinate completely untouched, and flatten the two
// non-year-scoped `app_company` columns that would otherwise bleed across years.
//
// Unit tests mock the driver and cannot prove this; the whole point is real row
// counts against a real Postgres. This runs under `pnpm test:integration` against
// the disposable container from `integration-setup.ts`, which exposes its URI via
// `process.env.DATABASE_URL` — the exact env var `resetCampaignYear` reads to
// connect, so the seed and the reset hit the same database.

const TARGET_YEAR = 2099;
const BYSTANDER_YEAR = 2088;
const USER_ID = "resetcy-it-user";
const LOCK_EXPIRES_AT = new Date("2099-12-31T00:00:00Z");
const FAR_FUTURE = "2099-12-31";

// The ten year-scoped tables `resetCampaignYear` purges, in the order it walks
// them (children first). Each count is taken for a single (TEST_SIREN, year)
// coordinate; the campaign deadline is keyed on `year` alone.
type CoordinateCounts = {
	employeeCategory: number;
	jobCategory: number;
	cseOpinionFile: number;
	cseOpinion: number;
	file: number;
	statusHistory: number;
	declarationLock: number;
	declaration: number;
	gipMdsData: number;
	campaignDeadline: number;
};

describe("resetCampaignYear (real Postgres) — #4067 coordinate isolation", () => {
	let sql!: ReturnType<typeof postgres>;

	async function seedCampaignYear(year: number) {
		// `id` is a Drizzle `$defaultFn` (app-side crypto.randomUUID), NOT a DB
		// default — raw INSERTs must supply it with gen_random_uuid(), exactly as
		// the production fixture helpers do.
		const [declaration] = await sql<[{ id: string }]>`
			INSERT INTO app_declaration (id, siren, year, declarant_id, status)
			VALUES (gen_random_uuid(), ${TEST_SIREN}, ${year}, ${USER_ID}, 'draft')
			RETURNING id
		`;
		const declarationId = declaration?.id;
		await sql`
			INSERT INTO app_declaration_lock (
				id, declaration_id, locked_by_user_id, locked_at, last_heartbeat_at, expires_at
			)
			VALUES (gen_random_uuid(), ${declarationId}, ${USER_ID}, NOW(), NOW(), ${LOCK_EXPIRES_AT})
		`;
		await sql`
			INSERT INTO app_declaration_status_history (id, declaration_id, event_type, round, created_at)
			VALUES (gen_random_uuid(), ${declarationId}, 'path_choice', 1, NOW())
		`;
		const [jobCategory] = await sql<[{ id: string }]>`
			INSERT INTO app_job_category (id, declaration_id, category_index, name, source)
			VALUES (gen_random_uuid(), ${declarationId}, 0, 'Ouvriers', 'user')
			RETURNING id
		`;
		await sql`
			INSERT INTO app_employee_category (id, job_category_id, declaration_type, women_count, men_count)
			VALUES (gen_random_uuid(), ${jobCategory?.id}, 'initial', 3, 4)
		`;
		const [file] = await sql<[{ id: string }]>`
			INSERT INTO app_file (id, declaration_id, file_name, file_path, uploaded_at, type)
			VALUES (gen_random_uuid(), ${declarationId}, 'avis.pdf', '/tmp/avis.pdf', NOW(), 'cse_opinion')
			RETURNING id
		`;
		await sql`
			INSERT INTO app_cse_opinion (id, declaration_id, declaration_number, type)
			VALUES (gen_random_uuid(), ${declarationId}, 1, 'remuneration')
		`;
		await sql`
			INSERT INTO app_cse_opinion_file (id, declaration_id, declaration_number, type, file_id)
			VALUES (gen_random_uuid(), ${declarationId}, 1, 'remuneration', ${file?.id})
		`;
		await sql`
			INSERT INTO app_gip_mds_data (siren, year, workforce_ema)
			VALUES (${TEST_SIREN}, ${year}, 250)
		`;
		await sql`
			INSERT INTO app_campaign_deadline (
				year,
				decl1_modification_deadline, decl1_justification_deadline, decl1_joint_evaluation_deadline,
				decl2_modification_deadline, decl2_justification_deadline, decl2_joint_evaluation_deadline
			)
			VALUES (
				${year},
				${FAR_FUTURE}, ${FAR_FUTURE}, ${FAR_FUTURE},
				${FAR_FUTURE}, ${FAR_FUTURE}, ${FAR_FUTURE}
			)
		`;
	}

	async function countCoordinate(year: number): Promise<CoordinateCounts> {
		const rows = await sql<[Record<keyof CoordinateCounts, number>]>`
			SELECT
				(SELECT count(*)::int FROM app_employee_category ec
					JOIN app_job_category jc ON jc.id = ec.job_category_id
					JOIN app_declaration d ON d.id = jc.declaration_id
					WHERE d.siren = ${TEST_SIREN} AND d.year = ${year}) AS "employeeCategory",
				(SELECT count(*)::int FROM app_job_category jc
					JOIN app_declaration d ON d.id = jc.declaration_id
					WHERE d.siren = ${TEST_SIREN} AND d.year = ${year}) AS "jobCategory",
				(SELECT count(*)::int FROM app_cse_opinion_file cof
					JOIN app_declaration d ON d.id = cof.declaration_id
					WHERE d.siren = ${TEST_SIREN} AND d.year = ${year}) AS "cseOpinionFile",
				(SELECT count(*)::int FROM app_cse_opinion co
					JOIN app_declaration d ON d.id = co.declaration_id
					WHERE d.siren = ${TEST_SIREN} AND d.year = ${year}) AS "cseOpinion",
				(SELECT count(*)::int FROM app_file f
					JOIN app_declaration d ON d.id = f.declaration_id
					WHERE d.siren = ${TEST_SIREN} AND d.year = ${year}) AS "file",
				(SELECT count(*)::int FROM app_declaration_status_history h
					JOIN app_declaration d ON d.id = h.declaration_id
					WHERE d.siren = ${TEST_SIREN} AND d.year = ${year}) AS "statusHistory",
				(SELECT count(*)::int FROM app_declaration_lock l
					JOIN app_declaration d ON d.id = l.declaration_id
					WHERE d.siren = ${TEST_SIREN} AND d.year = ${year}) AS "declarationLock",
				(SELECT count(*)::int FROM app_declaration d
					WHERE d.siren = ${TEST_SIREN} AND d.year = ${year}) AS "declaration",
				(SELECT count(*)::int FROM app_gip_mds_data g
					WHERE g.siren = ${TEST_SIREN} AND g.year = ${year}) AS "gipMdsData",
				(SELECT count(*)::int FROM app_campaign_deadline cd
					WHERE cd.year = ${year}) AS "campaignDeadline"
		`;
		return rows[0];
	}

	async function purgeAll() {
		// Full teardown for the test SIREN across both years and the shared rows
		// (company + user) so nothing leaks to another integration file that
		// happens to reuse this SIREN in the shared container.
		await resetCampaignYear(TARGET_YEAR);
		await resetCampaignYear(BYSTANDER_YEAR);
		await sql`DELETE FROM app_user_company WHERE siren = ${TEST_SIREN}`;
		await sql`DELETE FROM app_company WHERE siren = ${TEST_SIREN}`;
		await sql`DELETE FROM app_user WHERE id = ${USER_ID}`;
	}

	beforeAll(() => {
		sql = postgres(process.env.DATABASE_URL ?? "", { max: 1 });
	});

	afterAll(async () => {
		if (!sql) return;
		await purgeAll();
		await sql.end();
	});

	beforeEach(async () => {
		await purgeAll();
		await sql`
			INSERT INTO app_user (id, email, first_name, last_name)
			VALUES (${USER_ID}, 'resetcy-it@example.fr', 'Reset', 'CampaignYear')
		`;
		await sql`
			INSERT INTO app_company (siren, name, has_cse, workforce)
			VALUES (${TEST_SIREN}, 'Coordinate Test Company', true, 300)
		`;
		await seedCampaignYear(TARGET_YEAR);
		await seedCampaignYear(BYSTANDER_YEAR);
	});

	it("wipes every year-scoped row of the target coordinate", async () => {
		const before = await countCoordinate(TARGET_YEAR);
		expect(before).toStrictEqual({
			employeeCategory: 1,
			jobCategory: 1,
			cseOpinionFile: 1,
			cseOpinion: 1,
			file: 1,
			statusHistory: 1,
			declarationLock: 1,
			declaration: 1,
			gipMdsData: 1,
			campaignDeadline: 1,
		});

		await resetCampaignYear(TARGET_YEAR);

		expect(await countCoordinate(TARGET_YEAR)).toStrictEqual({
			employeeCategory: 0,
			jobCategory: 0,
			cseOpinionFile: 0,
			cseOpinion: 0,
			file: 0,
			statusHistory: 0,
			declarationLock: 0,
			declaration: 0,
			gipMdsData: 0,
			campaignDeadline: 0,
		});
	});

	it("releases the target coordinate's declaration lock", async () => {
		expect((await countCoordinate(TARGET_YEAR)).declarationLock).toBe(1);

		await resetCampaignYear(TARGET_YEAR);

		const remainingLocks = await sql<[{ n: number }]>`
			SELECT count(*)::int AS n FROM app_declaration_lock WHERE locked_by_user_id = ${USER_ID}
		`;
		// Only the bystander year's lock survives the target reset.
		expect(remainingLocks[0]?.n).toBe(1);
		expect((await countCoordinate(TARGET_YEAR)).declarationLock).toBe(0);
	});

	it("leaves a different year's coordinate completely intact", async () => {
		const bystanderBefore = await countCoordinate(BYSTANDER_YEAR);

		await resetCampaignYear(TARGET_YEAR);

		expect(await countCoordinate(BYSTANDER_YEAR)).toStrictEqual(
			bystanderBefore,
		);
		expect(bystanderBefore).toStrictEqual({
			employeeCategory: 1,
			jobCategory: 1,
			cseOpinionFile: 1,
			cseOpinion: 1,
			file: 1,
			statusHistory: 1,
			declarationLock: 1,
			declaration: 1,
			gipMdsData: 1,
			campaignDeadline: 1,
		});
	});

	it("flattens the shared app_company has_cse and workforce columns to NULL", async () => {
		const before = await sql<
			[{ hasCse: boolean | null; workforce: number | null }]
		>`
			SELECT has_cse AS "hasCse", workforce FROM app_company WHERE siren = ${TEST_SIREN}
		`;
		expect(before[0]?.hasCse).toBe(true);
		expect(before[0]?.workforce).toBe(300);

		await resetCampaignYear(TARGET_YEAR);

		const after = await sql<
			[{ hasCse: boolean | null; workforce: number | null }]
		>`
			SELECT has_cse AS "hasCse", workforce FROM app_company WHERE siren = ${TEST_SIREN}
		`;
		expect(after[0]?.hasCse).toBeNull();
		expect(after[0]?.workforce).toBeNull();
	});
});
