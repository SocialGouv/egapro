import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";
import { getCurrentYear } from "~/modules/domain";
import { appRouter } from "~/server/api/root";
import { db } from "~/server/db";
import { runWhileDeclarationLockHeld } from "./helpers/declarationLockRace";

const SIREN = "555666788";
const USER_ID = "compliance-preconditions-integration-user";
const USER_EMAIL = "compliance-preconditions-integration@example.fr";
const YEAR = getCurrentYear();

type CompliancePathValue = "justify" | "corrective_action" | "joint_evaluation";

let sql!: ReturnType<typeof postgres>;
let holder!: ReturnType<typeof postgres>;

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
	} as never);
}

async function insertDeclaration(state: {
	status: string;
	cseRequired?: boolean;
	firstDeclarationPathChoice?: CompliancePathValue | null;
	secondDeclarationPathChoice?: CompliancePathValue | null;
}) {
	const id = crypto.randomUUID();
	await sql`
		INSERT INTO app_declaration
			(id, siren, year, declarant_id, status, cse_required, current_step,
			 first_declaration_path_choice, second_declaration_path_choice)
		VALUES
			(${id}, ${SIREN}, ${YEAR}, ${USER_ID}, ${state.status}, ${state.cseRequired ?? true}, 6,
			 ${state.firstDeclarationPathChoice ?? null}, ${state.secondDeclarationPathChoice ?? null})
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
	event: {
		eventType: string;
		value?: CompliancePathValue;
		round?: 1 | 2;
		minutesAgo: number;
	},
	database: postgres.Sql | postgres.TransactionSql = sql,
) {
	await database`
		INSERT INTO app_declaration_status_history
			(id, declaration_id, event_type, value, round, actor_user_id, created_at)
		VALUES
			(${crypto.randomUUID()}, ${declarationId}, ${event.eventType}, ${event.value ?? null},
			 ${event.round ?? null}, ${USER_ID}, NOW() - ${event.minutesAgo}::int * INTERVAL '1 minute')
	`;
}

async function uploadJointEvaluationReport(
	declarationId: string,
	minutesAgo: number,
) {
	await sql`
		DELETE FROM app_file
		WHERE declaration_id = ${declarationId} AND type = 'joint_evaluation'
	`;
	await sql`
		INSERT INTO app_file (id, declaration_id, file_name, file_path, uploaded_at, created_at, type)
		VALUES
			(${crypto.randomUUID()}, ${declarationId}, 'evaluation-conjointe.pdf', 'test/evaluation-conjointe.pdf',
			 NOW() - ${minutesAgo}::int * INTERVAL '1 minute', NOW(), 'joint_evaluation')
	`;
}

const COMPLETE_CATEGORY_DATA = {
	womenCount: 9,
	menCount: 9,
	hourlyWomenCount: 9,
	hourlyMenCount: 9,
	annualBaseWomen: "30000",
	annualBaseMen: "30000",
	annualVariableWomen: "0",
	annualVariableMen: "0",
	hourlyBaseWomen: "20",
	hourlyBaseMen: "20",
	hourlyVariableWomen: "0",
	hourlyVariableMen: "0",
};

async function insertCategory(
	declarationId: string,
	declarationType: "initial" | "correction",
) {
	const jobId = crypto.randomUUID();
	await sql`
		INSERT INTO app_job_category (id, declaration_id, category_index, name, source)
		VALUES (${jobId}, ${declarationId}, 0, 'Cadres', 'manual')
	`;
	await sql`
		INSERT INTO app_employee_category
			(id, job_category_id, declaration_type, women_count, men_count)
		VALUES (${crypto.randomUUID()}, ${jobId}, ${declarationType}, 5, 5)
	`;
}

async function countEvents(declarationId: string, eventType: string) {
	const [row] = await sql<{ count: number }[]>`
		SELECT COUNT(*)::int AS count FROM app_declaration_status_history
		WHERE declaration_id = ${declarationId} AND event_type = ${eventType}
	`;
	return row?.count ?? 0;
}

async function readStatus(declarationId: string) {
	const [row] = await sql<{ status: string }[]>`
		SELECT status FROM app_declaration WHERE id = ${declarationId}
	`;
	return row?.status;
}

async function cleanup() {
	await sql`DELETE FROM audit.action_log WHERE user_id = ${USER_ID}`;
	await sql`DELETE FROM app_declaration_lock WHERE locked_by_user_id = ${USER_ID}`;
	await sql`
		DELETE FROM app_file WHERE declaration_id IN (
			SELECT id FROM app_declaration WHERE siren = ${SIREN}
		)
	`;
	await sql`
		DELETE FROM app_declaration_status_history WHERE declaration_id IN (
			SELECT id FROM app_declaration WHERE siren = ${SIREN}
		)
	`;
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

describe("compliance submissions re-read the démarche under the declaration lock (#4661)", () => {
	it("refuses a declaration already transmitted by a concurrent request", async () => {
		const id = await insertDeclaration({ status: "draft" });
		await insertCategory(id, "initial");

		const { blocked, outcome } = await runWhileDeclarationLockHeld({
			observer: sql,
			holder,
			declarationId: id,
			underLock: async (tx) => {
				await recordEvent(id, { eventType: "submit", minutesAgo: 0 }, tx);
				await recordEvent(
					id,
					{ eventType: "demarche_complete", minutesAgo: 0 },
					tx,
				);
				await tx`UPDATE app_declaration SET status = 'demarche_completed' WHERE id = ${id}`;
			},
			request: () => createCaller().declaration.submit(),
		});

		expect(blocked).toBe(true);
		expect(outcome).toMatchObject({
			status: "rejected",
			reason: { code: "PRECONDITION_FAILED" },
		});
		expect(await countEvents(id, "submit")).toBe(1);
	});

	it("refuses a corrected category write once the second declaration closed the démarche", async () => {
		const id = await insertDeclaration({
			status: "corrective_actions_chosen",
			cseRequired: false,
			firstDeclarationPathChoice: "corrective_action",
		});
		await insertCategory(id, "correction");

		const { blocked, outcome } = await runWhileDeclarationLockHeld({
			observer: sql,
			holder,
			declarationId: id,
			underLock: async (tx) => {
				await recordEvent(
					id,
					{ eventType: "second_declaration_submit", round: 2, minutesAgo: 0 },
					tx,
				);
				await tx`UPDATE app_declaration SET status = 'demarche_completed' WHERE id = ${id}`;
			},
			request: () =>
				createCaller().declaration.updateEmployeeCategories({
					declarationType: "correction",
					source: "manual",
					categories: [{ name: "Cadres", data: COMPLETE_CATEGORY_DATA }],
				}),
		});

		expect(blocked).toBe(true);
		expect(outcome).toMatchObject({
			status: "rejected",
			reason: { code: "FORBIDDEN" },
		});
		const [category] = await sql<{ women_count: number }[]>`
			SELECT ec.women_count FROM app_employee_category ec
			JOIN app_job_category jc ON jc.id = ec.job_category_id
			WHERE jc.declaration_id = ${id} AND ec.declaration_type = 'correction'
		`;
		expect(category?.women_count).toBe(5);
	});

	it("refuses a path change once a joint evaluation committed while the request waited", async () => {
		const id = await insertDeclaration({
			status: "joint_evaluation_chosen",
			firstDeclarationPathChoice: "joint_evaluation",
		});

		const { blocked, outcome } = await runWhileDeclarationLockHeld({
			observer: sql,
			holder,
			declarationId: id,
			underLock: async (tx) => {
				await recordEvent(
					id,
					{ eventType: "joint_evaluation_submit", round: 1, minutesAgo: 0 },
					tx,
				);
				await tx`UPDATE app_declaration SET status = 'awaiting_cse_opinion' WHERE id = ${id}`;
			},
			request: () =>
				createCaller().declaration.saveCompliancePath({
					path: "corrective_action",
				}),
		});

		expect(blocked).toBe(true);
		expect(outcome).toMatchObject({
			status: "rejected",
			reason: { code: "CONFLICT" },
		});
		expect(await readStatus(id)).toBe("awaiting_cse_opinion");
		expect(await countEvents(id, "path_choice")).toBe(0);
	});

	it("refuses a joint evaluation already transmitted by a concurrent request", async () => {
		const id = await insertDeclaration({
			status: "joint_evaluation_chosen",
			firstDeclarationPathChoice: "joint_evaluation",
		});
		await uploadJointEvaluationReport(id, 1);

		const { blocked, outcome } = await runWhileDeclarationLockHeld({
			observer: sql,
			holder,
			declarationId: id,
			underLock: async (tx) => {
				await recordEvent(
					id,
					{ eventType: "joint_evaluation_submit", round: 1, minutesAgo: 0 },
					tx,
				);
				await tx`UPDATE app_declaration SET status = 'awaiting_cse_opinion' WHERE id = ${id}`;
			},
			request: () => createCaller().declaration.submitJointEvaluation(),
		});

		expect(blocked).toBe(true);
		expect(outcome).toMatchObject({
			status: "rejected",
			reason: { code: "PRECONDITION_FAILED" },
		});
		expect(await countEvents(id, "joint_evaluation_submit")).toBe(1);
	});

	it("refuses a second declaration already transmitted by a concurrent request", async () => {
		const id = await insertDeclaration({
			status: "corrective_actions_chosen",
			cseRequired: false,
			firstDeclarationPathChoice: "corrective_action",
		});
		await insertCategory(id, "correction");

		const { blocked, outcome } = await runWhileDeclarationLockHeld({
			observer: sql,
			holder,
			declarationId: id,
			underLock: async (tx) => {
				await recordEvent(
					id,
					{ eventType: "second_declaration_submit", round: 2, minutesAgo: 0 },
					tx,
				);
				await tx`UPDATE app_declaration SET status = 'demarche_completed' WHERE id = ${id}`;
			},
			request: () => createCaller().declaration.submitSecondDeclaration(),
		});

		expect(blocked).toBe(true);
		expect(outcome).toMatchObject({
			status: "rejected",
			reason: { code: "PRECONDITION_FAILED" },
		});
		expect(await countEvents(id, "second_declaration_submit")).toBe(1);
	});
});

describe("a joint evaluation report only counts for the choice it was uploaded for", () => {
	it("does not let a first-round report satisfy the revised joint evaluation", async () => {
		const id = await insertDeclaration({
			status: "revised_joint_evaluation_chosen",
			firstDeclarationPathChoice: "corrective_action",
			secondDeclarationPathChoice: "joint_evaluation",
		});
		await recordEvent(id, {
			eventType: "path_choice",
			value: "joint_evaluation",
			round: 1,
			minutesAgo: 60,
		});
		await uploadJointEvaluationReport(id, 50);
		await recordEvent(id, {
			eventType: "path_choice",
			value: "corrective_action",
			round: 1,
			minutesAgo: 40,
		});
		await recordEvent(id, {
			eventType: "second_declaration_submit",
			round: 2,
			minutesAgo: 30,
		});
		await recordEvent(id, {
			eventType: "path_choice",
			value: "joint_evaluation",
			round: 2,
			minutesAgo: 20,
		});

		expect(await createCaller().jointEvaluation.getFile()).toBeNull();
		await expect(
			createCaller().declaration.submitJointEvaluation(),
		).rejects.toMatchObject({
			code: "PRECONDITION_FAILED",
			message:
				"Le rapport de l'évaluation conjointe doit être déposé avant sa transmission.",
		});
		expect(await countEvents(id, "joint_evaluation_submit")).toBe(0);

		await uploadJointEvaluationReport(id, 10);

		expect(await createCaller().jointEvaluation.getFile()).toMatchObject({
			fileName: "evaluation-conjointe.pdf",
		});
		await createCaller().declaration.submitJointEvaluation();
		expect(await readStatus(id)).toBe("awaiting_cse_opinion");
	});

	it("drops a report once the first-round choice left the joint evaluation and came back", async () => {
		const id = await insertDeclaration({
			status: "joint_evaluation_chosen",
			firstDeclarationPathChoice: "joint_evaluation",
		});
		await recordEvent(id, {
			eventType: "path_choice",
			value: "joint_evaluation",
			round: 1,
			minutesAgo: 30,
		});
		await uploadJointEvaluationReport(id, 25);
		await recordEvent(id, {
			eventType: "path_choice",
			value: "corrective_action",
			round: 1,
			minutesAgo: 20,
		});
		await recordEvent(id, {
			eventType: "path_choice",
			value: "joint_evaluation",
			round: 1,
			minutesAgo: 10,
		});

		expect(await createCaller().jointEvaluation.getFile()).toBeNull();
		await expect(
			createCaller().declaration.submitJointEvaluation(),
		).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
	});

	it("keeps the report when the joint evaluation is chosen again without leaving it", async () => {
		const id = await insertDeclaration({
			status: "joint_evaluation_chosen",
			firstDeclarationPathChoice: "joint_evaluation",
		});
		await recordEvent(id, {
			eventType: "path_choice",
			value: "joint_evaluation",
			round: 1,
			minutesAgo: 30,
		});
		await uploadJointEvaluationReport(id, 25);
		await recordEvent(id, {
			eventType: "path_choice",
			value: "joint_evaluation",
			round: 1,
			minutesAgo: 10,
		});

		expect(await createCaller().jointEvaluation.getFile()).toMatchObject({
			fileName: "evaluation-conjointe.pdf",
		});
		await createCaller().declaration.submitJointEvaluation();
		expect(await readStatus(id)).toBe("awaiting_cse_opinion");
	});
});
