import postgres from "postgres";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { env } from "~/env.js";

describe("declarations partial unique index (cancelled_at)", () => {
	let sql!: ReturnType<typeof postgres>;

	const SIREN = "123456789";
	const YEAR = 2025;

	beforeAll(() => {
		sql = postgres(env.DATABASE_URL, { max: 1 });
	});

	afterAll(async () => {
		if (!sql) return;
		await sql`DELETE FROM app_declaration WHERE siren = ${SIREN} AND year = ${YEAR}`;
		await sql`DELETE FROM app_company WHERE siren = ${SIREN}`;
		await sql`DELETE FROM app_user WHERE email = 'test-cancellation@example.fr'`;
		await sql.end();
	});

	beforeEach(async () => {
		await sql`DELETE FROM app_declaration WHERE siren = ${SIREN} AND year = ${YEAR}`;
		await sql`DELETE FROM app_company WHERE siren = ${SIREN}`;
		await sql`DELETE FROM app_user WHERE email = 'test-cancellation@example.fr'`;

		await sql`
			INSERT INTO app_user (id, email)
			VALUES ('test-cancel-user', 'test-cancellation@example.fr')
			ON CONFLICT DO NOTHING
		`;
		await sql`
			INSERT INTO app_company (siren, name)
			VALUES (${SIREN}, 'Test Company')
			ON CONFLICT DO NOTHING
		`;
	});

	it("allows one active row and one cancelled row for the same (siren, year)", async () => {
		await sql`
			INSERT INTO app_declaration (id, siren, year, declarant_id, cancelled_at)
			VALUES ('decl-active', ${SIREN}, ${YEAR}, 'test-cancel-user', NULL)
		`;
		await sql`
			INSERT INTO app_declaration (id, siren, year, declarant_id, cancelled_at)
			VALUES ('decl-cancelled', ${SIREN}, ${YEAR}, 'test-cancel-user', '2025-04-01')
		`;

		const rows = await sql<{ id: string }[]>`
			SELECT id FROM app_declaration WHERE siren = ${SIREN} AND year = ${YEAR}
		`;
		expect(rows).toHaveLength(2);
	});

	it("rejects a second active row for the same (siren, year)", async () => {
		await sql`
			INSERT INTO app_declaration (id, siren, year, declarant_id, cancelled_at)
			VALUES ('decl-active-1', ${SIREN}, ${YEAR}, 'test-cancel-user', NULL)
		`;

		await expect(
			sql`
				INSERT INTO app_declaration (id, siren, year, declarant_id, cancelled_at)
				VALUES ('decl-active-2', ${SIREN}, ${YEAR}, 'test-cancel-user', NULL)
			`,
		).rejects.toThrow(/unique/i);
	});
});
