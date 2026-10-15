import { TRPCError } from "@trpc/server";
import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";
import { getCurrentYear } from "~/modules/domain";
import { appRouter } from "~/server/api/root";
import { db } from "~/server/db";
import {
	findFormalNoticeFile,
	isFormalNoticeAvailableFor,
	loadGapCseOpinions,
	loadGapCseOpinionsFor,
} from "../formalNoticeExposure";

describe("formal notice exposure — real Postgres reads", () => {
	let sql!: ReturnType<typeof postgres>;

	const SIREN = "555666999";
	const OTHER_SIREN = "555666998";
	const USER_ID = "formal-notice-integration-user";
	const USER_EMAIL = "formal-notice-integration@example.fr";
	const YEAR = getCurrentYear();

	type DeclarationSeed = {
		siren?: string;
		year?: number;
		status?: string;
		cseRequired?: boolean;
		firstChoice?: string | null;
		secondChoice?: string | null;
	};

	async function insertDeclaration({
		siren = SIREN,
		year = YEAR,
		status = "demarche_completed",
		cseRequired = true,
		firstChoice = "justify",
		secondChoice = null,
	}: DeclarationSeed = {}) {
		const id = crypto.randomUUID();
		await sql`
			INSERT INTO app_declaration
				(id, siren, year, declarant_id, status, current_step, cse_required,
				 first_declaration_path_choice, second_declaration_path_choice)
			VALUES
				(${id}, ${siren}, ${year}, ${USER_ID}, ${status}, 6, ${cseRequired},
				 ${firstChoice}, ${secondChoice})
		`;
		return id;
	}

	async function insertOpinion(
		declarationId: string,
		declarationNumber: 1 | 2,
		type: "gap" | "accuracy",
		opinion: string | null,
	) {
		await sql`
			INSERT INTO app_cse_opinion (id, declaration_id, declaration_number, type, opinion)
			VALUES (${crypto.randomUUID()}, ${declarationId}, ${declarationNumber}, ${type}, ${opinion})
		`;
	}

	async function insertFile(
		declarationId: string,
		type: string,
		fileName: string,
	) {
		const id = crypto.randomUUID();
		await sql`
			INSERT INTO app_file (id, declaration_id, file_name, file_path, type, uploaded_at)
			VALUES (${id}, ${declarationId}, ${fileName}, ${`${SIREN}/${YEAR}/${id}.pdf`}, ${type}, NOW())
		`;
		return id;
	}

	async function readHistory(declarationId: string) {
		return sql<{ event_type: string; round: number | null }[]>`
			SELECT event_type, round FROM app_declaration_status_history
			WHERE declaration_id = ${declarationId}
		`;
	}

	function createCaller() {
		return appRouter.createCaller({
			db,
			session: {
				user: {
					id: USER_ID,
					siret: `${SIREN}00015`,
					isAdmin: false,
					impersonation: null,
				},
				expires: "",
			},
			headers: new Headers(),
		} as never).formalNotice;
	}

	async function cleanup() {
		await sql`DELETE FROM audit.action_log WHERE user_id = ${USER_ID}`;
		await sql`DELETE FROM app_declaration_status_history WHERE declaration_id IN (SELECT id FROM app_declaration WHERE siren IN (${SIREN}, ${OTHER_SIREN}))`;
		await sql`DELETE FROM app_file WHERE declaration_id IN (SELECT id FROM app_declaration WHERE siren IN (${SIREN}, ${OTHER_SIREN}))`;
		await sql`DELETE FROM app_cse_opinion WHERE declaration_id IN (SELECT id FROM app_declaration WHERE siren IN (${SIREN}, ${OTHER_SIREN}))`;
		await sql`DELETE FROM app_declaration WHERE siren IN (${SIREN}, ${OTHER_SIREN})`;
	}

	beforeAll(async () => {
		sql = postgres(env.DATABASE_URL, { max: 1 });
		await sql`
			INSERT INTO app_user (id, email) VALUES (${USER_ID}, ${USER_EMAIL})
			ON CONFLICT DO NOTHING
		`;
		await sql`
			INSERT INTO app_company (siren, name)
			VALUES (${SIREN}, 'Société Démo'), (${OTHER_SIREN}, 'Société Démo Bis')
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
		await sql`DELETE FROM app_company WHERE siren IN (${SIREN}, ${OTHER_SIREN})`;
		await sql`DELETE FROM app_user WHERE id = ${USER_ID}`;
		await sql.end();
	});

	beforeEach(async () => {
		await cleanup();
	});

	it("loads only the gap opinions, by round, for several declarations in one call", async () => {
		const first = await insertDeclaration();
		const second = await insertDeclaration({
			siren: OTHER_SIREN,
			firstChoice: "corrective_action",
			secondChoice: "justify",
		});
		const withoutGap = await insertDeclaration({ year: YEAR - 1 });
		await insertOpinion(first, 1, "gap", "unfavorable");
		await insertOpinion(first, 1, "accuracy", "favorable");
		await insertOpinion(second, 1, "gap", "favorable");
		await insertOpinion(second, 2, "gap", "unfavorable");
		await insertOpinion(second, 2, "accuracy", "unfavorable");
		await insertOpinion(withoutGap, 1, "accuracy", "unfavorable");

		const opinions = await loadGapCseOpinions(db, [first, second, withoutGap]);

		expect(Object.fromEntries(opinions)).toEqual({
			[first]: { first: "unfavorable", second: null },
			[second]: { first: "favorable", second: "unfavorable" },
		});
		expect(await loadGapCseOpinionsFor(db, withoutGap)).toEqual({
			first: null,
			second: null,
		});
	});

	it("exposes a justified démarche whose gap opinion is unfavorable", async () => {
		const id = await insertDeclaration();
		await insertOpinion(id, 1, "gap", "unfavorable");

		expect(await isFormalNoticeAvailableFor(db, id)).toBe(true);
	});

	it("exposes a justified démarche without CSE", async () => {
		const id = await insertDeclaration({ cseRequired: false });

		expect(await isFormalNoticeAvailableFor(db, id)).toBe(true);
	});

	it("does not expose a démarche whose only unfavorable opinion is on accuracy", async () => {
		const id = await insertDeclaration();
		await insertOpinion(id, 1, "accuracy", "unfavorable");
		await insertOpinion(id, 1, "gap", "favorable");

		expect(await isFormalNoticeAvailableFor(db, id)).toBe(false);
	});

	it("does not expose a démarche still waiting for its CSE opinion", async () => {
		const id = await insertDeclaration({ status: "awaiting_cse_opinion" });
		await insertOpinion(id, 1, "gap", "unfavorable");

		expect(await isFormalNoticeAvailableFor(db, id)).toBe(false);
	});

	it("does not expose an unknown declaration", async () => {
		expect(await isFormalNoticeAvailableFor(db, crypto.randomUUID())).toBe(
			false,
		);
	});

	it("finds only the formal notice report among the declaration files", async () => {
		const id = await insertDeclaration();
		await insertFile(id, "joint_evaluation", "evaluation.pdf");
		await insertFile(id, "cse_opinion", "avis.pdf");

		expect(await findFormalNoticeFile(db, id)).toBeNull();

		const reportId = await insertFile(
			id,
			"formal_notice_joint_evaluation",
			"evaluation-mise-en-demeure.pdf",
		);

		expect(await findFormalNoticeFile(db, id)).toEqual({
			id: reportId,
			fileName: "evaluation-mise-en-demeure.pdf",
			uploadedAt: expect.any(Date),
		});
	});

	it("records the submission event and keeps the démarche closed", async () => {
		const id = await insertDeclaration();
		await insertOpinion(id, 1, "gap", "unfavorable");
		await insertFile(
			id,
			"formal_notice_joint_evaluation",
			"evaluation-mise-en-demeure.pdf",
		);

		expect(await createCaller().submit()).toEqual({ success: true });

		expect(await readHistory(id)).toEqual([
			{ event_type: "formal_notice_joint_evaluation_submit", round: null },
		]);
		const [row] = await sql<{ status: string }[]>`
			SELECT status FROM app_declaration WHERE id = ${id}
		`;
		expect(row?.status).toBe("demarche_completed");
	});

	it("refuses the submission without a deposited report and records nothing", async () => {
		const id = await insertDeclaration();
		await insertOpinion(id, 1, "gap", "unfavorable");

		await expect(createCaller().submit()).rejects.toThrow(TRPCError);

		expect(await readHistory(id)).toEqual([]);
	});
});
