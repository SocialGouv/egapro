import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";
import { getCurrentYear } from "~/modules/domain";
import { appRouter } from "~/server/api/root";
import { db } from "~/server/db";

describe("declaration.saveCompliancePath — gap qualification", () => {
	let sql!: ReturnType<typeof postgres>;

	const SIREN = "555666778";
	const USER_ID = "0c8f6f7e-3b7a-4f3e-9d0a-6a1c2b3d4e5f";
	const USER_EMAIL = "gap-justification-integration@example.fr";
	const YEAR = getCurrentYear();

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

	async function insertLockedDeclaration(status: string) {
		const id = crypto.randomUUID();
		await sql`
			INSERT INTO app_declaration
				(id, siren, year, declarant_id, status, cse_required, current_step)
			VALUES
				(${id}, ${SIREN}, ${YEAR}, ${USER_ID}, ${status}, true, 6)
		`;
		await sql`
			INSERT INTO app_declaration_lock
				(id, declaration_id, locked_by_user_id, locked_at, last_heartbeat_at, expires_at)
			VALUES
				(${crypto.randomUUID()}, ${id}, ${USER_ID}, NOW(), NOW(), NOW() + INTERVAL '30 minutes')
		`;
		return id;
	}

	async function markSecondDeclarationSubmitted(declarationId: string) {
		await sql`
			INSERT INTO app_declaration_status_history
				(id, declaration_id, event_type, round, actor_user_id, created_at)
			VALUES
				(${crypto.randomUUID()}, ${declarationId}, 'second_declaration_submit', 2, ${USER_ID}, NOW())
		`;
	}

	async function readQualifications(declarationId: string) {
		const [row] = await sql<
			{ first: string | null; second: string | null; path: string | null }[]
		>`
			SELECT first_declaration_gap_justification AS first,
				second_declaration_gap_justification AS second,
				first_declaration_path_choice AS path
			FROM app_declaration WHERE id = ${declarationId}
		`;
		return row;
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
		await sql`
			INSERT INTO app_user_company (user_id, siren) VALUES (${USER_ID}, ${SIREN})
			ON CONFLICT DO NOTHING
		`;
	});

	afterAll(async () => {
		if (!sql) return;
		await sql`DELETE FROM audit.action_log WHERE user_id = ${USER_ID}`;
		await sql`DELETE FROM app_declaration_lock WHERE locked_by_user_id = ${USER_ID}`;
		await sql`DELETE FROM app_declaration_status_history WHERE actor_user_id = ${USER_ID}`;
		await sql`DELETE FROM app_declaration WHERE siren = ${SIREN}`;
		await sql`DELETE FROM app_user_company WHERE user_id = ${USER_ID}`;
		await sql`DELETE FROM app_company WHERE siren = ${SIREN}`;
		await sql`DELETE FROM app_user WHERE id = ${USER_ID}`;
		await sql.end();
	});

	beforeEach(async () => {
		await sql`DELETE FROM app_declaration_lock WHERE locked_by_user_id = ${USER_ID}`;
		await sql`DELETE FROM app_declaration_status_history WHERE actor_user_id = ${USER_ID}`;
		await sql`DELETE FROM app_declaration WHERE siren = ${SIREN}`;
	});

	it("writes the qualification in the first-declaration column at round 1", async () => {
		const id = await insertLockedDeclaration("awaiting_compliance_path_choice");

		await createCaller().saveCompliancePath({
			gapJustification: "partial",
			path: "joint_evaluation",
		});

		expect(await readQualifications(id)).toEqual({
			first: "partial",
			second: null,
			path: "joint_evaluation",
		});
	});

	it("writes the qualification in the second-declaration column at round 2", async () => {
		const id = await insertLockedDeclaration("awaiting_revision_choice");
		await sql`UPDATE app_declaration SET first_declaration_path_choice = 'corrective_action', first_declaration_gap_justification = 'none' WHERE id = ${id}`;
		await markSecondDeclarationSubmitted(id);

		await createCaller().saveCompliancePath({
			gapJustification: "partial",
			path: "joint_evaluation",
		});

		expect(await readQualifications(id)).toMatchObject({
			first: "none",
			second: "partial",
		});
	});

	it.each([
		["all", "joint_evaluation"],
		["partial", "justify"],
		["none", "justify"],
		["all", "corrective_action"],
	] as const)("refuses %s with %s and writes nothing", async (gapJustification, path) => {
		const id = await insertLockedDeclaration("awaiting_compliance_path_choice");

		await expect(
			createCaller().saveCompliancePath({ gapJustification, path }),
		).rejects.toMatchObject({ code: "BAD_REQUEST" });

		expect(await readQualifications(id)).toEqual({
			first: null,
			second: null,
			path: null,
		});
	});

	it("overwrites the qualification when the choice is revised", async () => {
		const id = await insertLockedDeclaration("awaiting_compliance_path_choice");
		const caller = createCaller();

		await caller.saveCompliancePath({
			gapJustification: "partial",
			path: "joint_evaluation",
		});
		await caller.saveCompliancePath({
			gapJustification: "none",
			path: "corrective_action",
		});

		expect(await readQualifications(id)).toEqual({
			first: "none",
			second: null,
			path: "corrective_action",
		});
	});
});
