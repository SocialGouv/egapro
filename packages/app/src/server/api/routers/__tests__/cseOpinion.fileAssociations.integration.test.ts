import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";

describe("cse_opinion_file DB-level constraints", () => {
	let sql!: ReturnType<typeof postgres>;

	const SIREN = "123456789";
	const YEAR = 2025;
	const USER_ID = "test-cse-assoc-user";
	const USER_EMAIL = "test-cse-assoc@example.fr";
	const DECL_ID = "decl-cse-assoc";
	const FILE_ID = "file-cse-assoc";

	async function cleanup() {
		await sql`DELETE FROM app_cse_opinion_file WHERE declaration_id = ${DECL_ID}`;
		await sql`DELETE FROM app_file WHERE declaration_id = ${DECL_ID}`;
		await sql`DELETE FROM app_declaration WHERE id = ${DECL_ID}`;
		await sql`DELETE FROM app_company WHERE siren = ${SIREN}`;
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

		await sql`
			INSERT INTO app_user (id, email)
			VALUES (${USER_ID}, ${USER_EMAIL})
		`;
		await sql`
			INSERT INTO app_company (siren, name)
			VALUES (${SIREN}, 'Test Company')
		`;
		await sql`
			INSERT INTO app_declaration (id, siren, year, declarant_id)
			VALUES (${DECL_ID}, ${SIREN}, ${YEAR}, ${USER_ID})
		`;
		await sql`
			INSERT INTO app_file (id, declaration_id, file_name, file_path, type, uploaded_at)
			VALUES (${FILE_ID}, ${DECL_ID}, 'avis.pdf', ${`${SIREN}/2025/avis.pdf`}, 'cse_opinion', now())
		`;
	});

	it("cascades the delete of a file to its content-type associations", async () => {
		await sql`
			INSERT INTO app_cse_opinion_file (id, declaration_id, declaration_number, type, file_id)
			VALUES
				('assoc-1', ${DECL_ID}, 1, 'accuracy', ${FILE_ID}),
				('assoc-2', ${DECL_ID}, 1, 'gap', ${FILE_ID})
		`;

		const before = await sql<{ count: number }[]>`
			SELECT count(*)::int AS count FROM app_cse_opinion_file WHERE file_id = ${FILE_ID}
		`;
		expect(before[0]?.count).toBe(2);

		await sql`DELETE FROM app_file WHERE id = ${FILE_ID}`;

		const after = await sql<{ count: number }[]>`
			SELECT count(*)::int AS count FROM app_cse_opinion_file WHERE declaration_id = ${DECL_ID}
		`;
		expect(after[0]?.count).toBe(0);
	});

	it("allows the same file to cover several (declarationNumber, type) couples", async () => {
		await sql`
			INSERT INTO app_cse_opinion_file (id, declaration_id, declaration_number, type, file_id)
			VALUES
				('assoc-1', ${DECL_ID}, 1, 'accuracy', ${FILE_ID}),
				('assoc-2', ${DECL_ID}, 2, 'gap', ${FILE_ID})
		`;

		const rows = await sql<{ count: number }[]>`
			SELECT count(*)::int AS count FROM app_cse_opinion_file WHERE file_id = ${FILE_ID}
		`;
		expect(rows[0]?.count).toBe(2);
	});

	it("rejects two associations for the same (declaration, number, type) couple", async () => {
		await sql`
			INSERT INTO app_cse_opinion_file (id, declaration_id, declaration_number, type, file_id)
			VALUES ('assoc-1', ${DECL_ID}, 1, 'accuracy', ${FILE_ID})
		`;

		await expect(
			sql`
				INSERT INTO app_cse_opinion_file (id, declaration_id, declaration_number, type, file_id)
				VALUES ('assoc-2', ${DECL_ID}, 1, 'accuracy', ${FILE_ID})
			`,
		).rejects.toThrow(/unique/i);
	});
});
