import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";
import { declarationDraftRouter } from "~/server/api/routers/declarationDraft";
import { db } from "~/server/db";

describe("declarationDraftRouter save/get roundtrip (real Postgres)", () => {
	let sql!: ReturnType<typeof postgres>;

	const SIREN = "987654321";
	const YEAR = 2025;
	const USER_ID = "draft-integration-test-user";
	const USER_EMAIL = "draft-integration@example.fr";
	const USER_SIRET = `${SIREN}00015`;

	function createCaller() {
		return declarationDraftRouter.createCaller({
			db,
			session: {
				user: {
					id: USER_ID,
					email: USER_EMAIL,
					siret: USER_SIRET,
					isAdmin: false,
					impersonation: null,
				},
				expires: "",
			},
			headers: new Headers(),
		} as never);
	}

	beforeAll(() => {
		sql = postgres(env.DATABASE_URL, { max: 1 });
	});

	afterAll(async () => {
		if (!sql) return;
		await sql`DELETE FROM app_declaration WHERE siren = ${SIREN}`;
		await sql`DELETE FROM app_user_company WHERE user_id = ${USER_ID}`;
		await sql`DELETE FROM app_company WHERE siren = ${SIREN}`;
		await sql`DELETE FROM app_user WHERE id = ${USER_ID}`;
		await sql.end();
	});

	beforeEach(async () => {
		await sql`DELETE FROM app_declaration WHERE siren = ${SIREN}`;
		await sql`DELETE FROM app_user_company WHERE user_id = ${USER_ID}`;
		await sql`DELETE FROM app_company WHERE siren = ${SIREN}`;
		await sql`DELETE FROM app_user WHERE id = ${USER_ID}`;

		await sql`
			INSERT INTO app_user (id, email)
			VALUES (${USER_ID}, ${USER_EMAIL})
		`;
		await sql`
			INSERT INTO app_company (siren, name)
			VALUES (${SIREN}, 'Draft Roundtrip Company')
		`;
		await sql`
			INSERT INTO app_user_company (user_id, siren)
			VALUES (${USER_ID}, ${SIREN})
		`;
	});

	it("persists a saved slice and returns it on a subsequent get", async () => {
		const caller = createCaller();
		const data = { workforce: 50, payGap: 3.5 };

		const saveResult = await caller.save({
			siren: SIREN,
			year: YEAR,
			slice: { kind: "main", step: "step1", data },
		});
		expect(saveResult).toEqual({ ok: true });

		const draft = await caller.get({ siren: SIREN, year: YEAR });

		expect(draft).not.toBeNull();
		expect(draft).toEqual({ main: { step1: data } });
	});

	it("merges successive saves of different slices into a single draft", async () => {
		const caller = createCaller();

		await caller.save({
			siren: SIREN,
			year: YEAR,
			slice: { kind: "main", step: "step1", data: { workforce: 50 } },
		});
		await caller.save({
			siren: SIREN,
			year: YEAR,
			slice: { kind: "cse", step: "opinion", data: { value: "favorable" } },
		});

		const draft = await caller.get({ siren: SIREN, year: YEAR });

		expect(draft).toEqual({
			main: { step1: { workforce: 50 } },
			cse: { opinion: { value: "favorable" } },
		});
	});

	it("stamps draftUpdatedAt so the freshly saved draft is not TTL-expired", async () => {
		const caller = createCaller();

		await caller.save({
			siren: SIREN,
			year: YEAR,
			slice: { kind: "main", step: "step1", data: { workforce: 50 } },
		});

		const rows = await sql<{ draftUpdatedAt: Date | null }[]>`
			SELECT draft_updated_at AS "draftUpdatedAt"
			FROM app_declaration
			WHERE siren = ${SIREN} AND year = ${YEAR} AND cancelled_at IS NULL
		`;
		const draftUpdatedAt = rows[0]?.draftUpdatedAt;

		expect(draftUpdatedAt).toBeInstanceOf(Date);
		expect(Date.now() - (draftUpdatedAt as Date).getTime()).toBeLessThan(
			30 * 24 * 3600 * 1000,
		);
	});
});
