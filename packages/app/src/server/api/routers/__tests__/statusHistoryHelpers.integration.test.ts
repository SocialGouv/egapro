import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";
import {
	DECLARATION_SUPERSEDED_MESSAGE,
	getCurrentYear,
} from "~/modules/domain";
import { appRouter } from "~/server/api/root";
import { db } from "~/server/db";
import {
	hasLockingEventForRound,
	isLockedBySubsequentSubmissionFor,
	loadSubsequentSubmissions,
} from "../statusHistoryHelpers";

describe("subsequent-submission lock — real history reads", () => {
	let sql!: ReturnType<typeof postgres>;

	const SIREN = "555666888";
	const USER_ID = "subsequent-submission-integration-user";
	const USER_EMAIL = "subsequent-submission-integration@example.fr";
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

	async function insertSubmittedDeclaration(status: string) {
		const id = crypto.randomUUID();
		await sql`
			INSERT INTO app_declaration
				(id, siren, year, declarant_id, status, current_step,
				 total_women, total_men, hourly_women, hourly_men)
			VALUES
				(${id}, ${SIREN}, ${YEAR}, ${USER_ID}, ${status}, 6,
				 ${TOTALS.totalWomen}, ${TOTALS.totalMen}, ${TOTALS.hourlyWomen}, ${TOTALS.hourlyMen})
		`;
		await sql`
			INSERT INTO app_declaration_lock
				(id, declaration_id, locked_by_user_id, locked_at, last_heartbeat_at, expires_at)
			VALUES
				(${crypto.randomUUID()}, ${id}, ${USER_ID}, NOW(), NOW(), NOW() + INTERVAL '30 minutes')
		`;
		return id;
	}

	async function recordEvent(
		declarationId: string,
		eventType: string,
		round: number | null,
	) {
		await sql`
			INSERT INTO app_declaration_status_history
				(id, declaration_id, event_type, round, actor_user_id, created_at)
			VALUES
				(${crypto.randomUUID()}, ${declarationId}, ${eventType}, ${round}, ${USER_ID}, NOW())
		`;
	}

	async function readTotalWomen(declarationId: string) {
		const [row] = await sql<{ total_women: number | null }[]>`
			SELECT total_women FROM app_declaration WHERE id = ${declarationId}
		`;
		return row?.total_women ?? null;
	}

	async function cleanup() {
		await sql`DELETE FROM audit.action_log WHERE user_id = ${USER_ID}`;
		await sql`DELETE FROM app_declaration_lock WHERE locked_by_user_id = ${USER_ID}`;
		await sql`DELETE FROM app_declaration_status_history WHERE actor_user_id = ${USER_ID}`;
		await sql`DELETE FROM app_declaration WHERE siren = ${SIREN}`;
	}

	beforeAll(async () => {
		sql = postgres(env.DATABASE_URL, { max: 1 });
		await sql`
			INSERT INTO app_user (id, email) VALUES (${USER_ID}, ${USER_EMAIL})
			ON CONFLICT DO NOTHING
		`;
		await sql`
			INSERT INTO app_company (siren, name) VALUES (${SIREN}, 'Société Démo')
			ON CONFLICT DO NOTHING
		`;
	});

	afterAll(async () => {
		if (!sql) return;
		await cleanup();
		await sql`DELETE FROM app_company WHERE siren = ${SIREN}`;
		await sql`DELETE FROM app_user WHERE id = ${USER_ID}`;
		await sql.end();
	});

	beforeEach(async () => {
		await cleanup();
	});

	it("derives the downstream submissions from the enum rows, ignoring step changes and path choices", async () => {
		const id = await insertSubmittedDeclaration("awaiting_cse_opinion");
		await recordEvent(id, "submit", null);
		await recordEvent(id, "step_change", 6);
		await recordEvent(id, "path_choice", 1);
		await recordEvent(id, "second_declaration_submit", 2);
		await recordEvent(id, "second_declaration_submit", 2);
		await recordEvent(id, "joint_evaluation_submit", 2);

		await expect(loadSubsequentSubmissions(db, id)).resolves.toEqual({
			hasSubmittedSecondDeclaration: true,
			secondDeclarationSubmissionCount: 2,
			hasSubmittedJointEvaluation: true,
			hasSubmittedRound1JointEvaluation: false,
			hasSubmittedCseOpinion: false,
		});
		await expect(
			isLockedBySubsequentSubmissionFor(db, id, "first_declaration"),
		).resolves.toBe(true);
		await expect(hasLockingEventForRound(db, id, 1)).resolves.toBe(false);
		await expect(hasLockingEventForRound(db, id, 2)).resolves.toBe(true);
	});

	it("keeps a first declaration with only a path choice modifiable", async () => {
		const id = await insertSubmittedDeclaration("demarche_completed");
		await recordEvent(id, "submit", null);
		await recordEvent(id, "path_choice", 1);
		await recordEvent(id, "demarche_complete", null);

		await expect(
			createCaller().updateStep1({ ...TOTALS, totalWomen: 11 }),
		).resolves.toEqual({ success: true });
		expect(await readTotalWomen(id)).toBe(11);
	});

	it("rejects a first-declaration write once a second declaration was submitted, leaving the row untouched", async () => {
		const id = await insertSubmittedDeclaration("awaiting_cse_opinion");
		await recordEvent(id, "submit", null);
		await recordEvent(id, "second_declaration_submit", 2);

		await expect(
			createCaller().updateStep1({ ...TOTALS, totalWomen: 11 }),
		).rejects.toMatchObject({
			code: "FORBIDDEN",
			message: DECLARATION_SUPERSEDED_MESSAGE,
		});
		expect(await readTotalWomen(id)).toBe(TOTALS.totalWomen);
	});
});
