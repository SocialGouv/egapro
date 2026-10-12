import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";
import {
	DECLARATION_SUPERSEDED_MESSAGE,
	getCurrentYear,
} from "~/modules/domain";
import { appRouter } from "~/server/api/root";
import { db } from "~/server/db";
import { runWhileDeclarationLockHeld } from "./helpers/declarationLockRace";

describe("first-declaration writes racing a subsequent submission", () => {
	let sql!: ReturnType<typeof postgres>;
	let holder!: ReturnType<typeof postgres>;

	const SIREN = "555666777";
	const USER_ID = "first-declaration-race-integration-user";
	const USER_EMAIL = "first-declaration-race-integration@example.fr";
	const YEAR = getCurrentYear();
	const TOTALS = {
		totalWomen: 10,
		totalMen: 20,
		hourlyWomen: 10,
		hourlyMen: 20,
	};

	function createCaller() {
		return appRouter.createCaller({
			db,
			session: {
				user: {
					id: USER_ID,
					email: USER_EMAIL,
					siret: `${SIREN}00015`,
					isAdmin: false,
					impersonation: null,
				},
				expires: "",
			},
			headers: new Headers(),
		} as never).declaration;
	}

	async function insertDeclaration() {
		const id = crypto.randomUUID();
		await sql`
			INSERT INTO app_declaration
				(id, siren, year, declarant_id, status, current_step,
				 total_women, total_men, hourly_women, hourly_men)
			VALUES
				(${id}, ${SIREN}, ${YEAR}, ${USER_ID}, 'awaiting_revision_choice', 6,
				 ${TOTALS.totalWomen}, ${TOTALS.totalMen}, ${TOTALS.hourlyWomen}, ${TOTALS.hourlyMen})
		`;
		await sql`
			INSERT INTO app_declaration_lock
				(id, declaration_id, locked_by_user_id, locked_at, last_heartbeat_at, expires_at)
			VALUES
				(${crypto.randomUUID()}, ${id}, ${USER_ID}, NOW(), NOW(), NOW() + INTERVAL '30 minutes')
		`;
		const jobId = crypto.randomUUID();
		await sql`
			INSERT INTO app_job_category (id, declaration_id, category_index, name, source)
			VALUES (${jobId}, ${id}, 0, 'Cadres', 'manual')
		`;
		await sql`
			INSERT INTO app_employee_category
				(id, job_category_id, declaration_type, women_count, men_count)
			VALUES
				(${crypto.randomUUID()}, ${jobId}, 'correction', 5, 5)
		`;
		return id;
	}

	async function countCorrectionCategories(declarationId: string) {
		const [row] = await sql<{ count: number }[]>`
			SELECT COUNT(*)::int AS count
			FROM app_employee_category ec
			JOIN app_job_category jc ON jc.id = ec.job_category_id
			WHERE jc.declaration_id = ${declarationId}
				AND ec.declaration_type = 'correction'
		`;
		return row?.count ?? 0;
	}

	async function readTotalWomen(declarationId: string) {
		const [row] = await sql<{ total_women: number | null }[]>`
			SELECT total_women FROM app_declaration WHERE id = ${declarationId}
		`;
		return row?.total_women ?? null;
	}

	function withDeclarationLockHeld<T>(
		declarationId: string,
		concurrentWrite: () => Promise<T>,
		options: { recordSubmission: boolean },
	) {
		return runWhileDeclarationLockHeld({
			observer: sql,
			holder,
			declarationId,
			underLock: async (tx) => {
				if (!options.recordSubmission) return;
				await tx`
					INSERT INTO app_declaration_status_history
						(id, declaration_id, event_type, round, actor_user_id, created_at)
					VALUES
						(${crypto.randomUUID()}, ${declarationId}, 'second_declaration_submit', 2, ${USER_ID}, NOW())
				`;
			},
			request: concurrentWrite,
		});
	}

	async function cleanup() {
		await sql`DELETE FROM audit.action_log WHERE user_id = ${USER_ID}`;
		await sql`DELETE FROM app_declaration_lock WHERE locked_by_user_id = ${USER_ID}`;
		await sql`DELETE FROM app_declaration_status_history WHERE actor_user_id = ${USER_ID}`;
		await sql`
			DELETE FROM app_employee_category WHERE job_category_id IN (
				SELECT jc.id FROM app_job_category jc
				JOIN app_declaration d ON d.id = jc.declaration_id
				WHERE d.siren = ${SIREN}
			)
		`;
		await sql`
			DELETE FROM app_job_category WHERE declaration_id IN (
				SELECT id FROM app_declaration WHERE siren = ${SIREN}
			)
		`;
		await sql`DELETE FROM app_declaration WHERE siren = ${SIREN}`;
	}

	beforeAll(async () => {
		sql = postgres(env.DATABASE_URL, { max: 2 });
		holder = postgres(env.DATABASE_URL, { max: 1 });
		await sql`
			INSERT INTO app_user (id, email) VALUES (${USER_ID}, ${USER_EMAIL})
			ON CONFLICT DO NOTHING
		`;
		await sql`
			INSERT INTO app_company (siren, name) VALUES (${SIREN}, 'Société Démo')
			ON CONFLICT DO NOTHING
		`;
		await sql`
			INSERT INTO app_user_company (user_id, siren) VALUES (${USER_ID}, ${SIREN})
			ON CONFLICT DO NOTHING
		`;
	});

	afterAll(async () => {
		if (!sql) return;
		await cleanup();
		await sql`DELETE FROM app_user_company WHERE user_id = ${USER_ID}`;
		await sql`DELETE FROM app_company WHERE siren = ${SIREN}`;
		await sql`DELETE FROM app_user WHERE id = ${USER_ID}`;
		await holder.end();
		await sql.end();
	});

	beforeEach(async () => {
		await cleanup();
	});

	it("re-evaluates the guard under the declaration lock, so a submission committed mid-request wins", async () => {
		const id = await insertDeclaration();

		const { blocked, outcome } = await withDeclarationLockHeld(
			id,
			() => createCaller().updateStep1({ ...TOTALS, totalWomen: 11 }),
			{ recordSubmission: true },
		);

		expect(blocked).toBe(true);
		expect(outcome).toMatchObject({
			status: "rejected",
			reason: { code: "FORBIDDEN", message: DECLARATION_SUPERSEDED_MESSAGE },
		});
		expect(await readTotalWomen(id)).toBe(TOTALS.totalWomen);
		expect(await countCorrectionCategories(id)).toBe(1);
	});

	it("applies the same re-check to the employee categories write", async () => {
		const id = await insertDeclaration();

		const { blocked, outcome } = await withDeclarationLockHeld(
			id,
			() =>
				createCaller().updateEmployeeCategories({
					declarationType: "initial",
					source: "manual",
					categories: [],
				}),
			{ recordSubmission: true },
		);

		expect(blocked).toBe(true);
		expect(outcome).toMatchObject({
			status: "rejected",
			reason: { code: "FORBIDDEN", message: DECLARATION_SUPERSEDED_MESSAGE },
		});
		expect(await countCorrectionCategories(id)).toBe(1);
	});

	it("makes a second-declaration submission wait for a first-declaration write already in flight", async () => {
		const id = await insertDeclaration();

		const { blocked, outcome } = await withDeclarationLockHeld(
			id,
			() => createCaller().submitSecondDeclaration(),
			{ recordSubmission: false },
		);

		expect(blocked).toBe(true);
		expect(outcome).toMatchObject({ status: "fulfilled" });
		const events = await sql`
			SELECT 1 FROM app_declaration_status_history
			WHERE declaration_id = ${id} AND event_type = 'second_declaration_submit'
		`;
		expect(events).toHaveLength(1);
	});
});
