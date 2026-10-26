import postgres from "postgres";
import { TEST_SIREN } from "../constants";

export const OTHER_LOCK_HOLDER_ID = "e2e-declaration-lock-holder-4492";
export const OTHER_LOCK_HOLDER_NAME = "Sophie Exemple";

const DEFAULT_DB_URL = "postgresql://postgres:postgres@localhost:5438/egapro";

function connect() {
	return postgres(process.env.DATABASE_URL ?? DEFAULT_DB_URL, { max: 1 });
}

async function declarationId(sql: ReturnType<typeof connect>, year: number) {
	const rows = await sql<{ id: string }[]>`
		SELECT id FROM app_declaration
		WHERE siren = ${TEST_SIREN} AND year = ${year} AND cancelled_at IS NULL
		ORDER BY created_at DESC LIMIT 1
	`;
	const id = rows[0]?.id;
	if (!id)
		throw new Error(`No active E2E declaration for ${TEST_SIREN}/${year}`);
	return id;
}

export async function readDeclarationLockOwner(
	year: number,
): Promise<string | null> {
	const sql = connect();
	try {
		const id = await declarationId(sql, year);
		const rows = await sql<{ locked_by_user_id: string }[]>`
			SELECT locked_by_user_id FROM app_declaration_lock
			WHERE declaration_id = ${id}
		`;
		return rows[0]?.locked_by_user_id ?? null;
	} finally {
		await sql.end();
	}
}

export async function seedOtherDeclarantLock(year: number, expired = false) {
	const sql = connect();
	try {
		const id = await declarationId(sql, year);
		await sql`
			INSERT INTO app_user (id, first_name, last_name, email)
			VALUES (${OTHER_LOCK_HOLDER_ID}, 'Sophie', 'Exemple', 'sophie.exemple@example.fr')
			ON CONFLICT (id) DO UPDATE SET
				first_name = EXCLUDED.first_name,
				last_name = EXCLUDED.last_name,
				email = EXCLUDED.email
		`;
		await sql`
			INSERT INTO app_user_company (user_id, siren)
			VALUES (${OTHER_LOCK_HOLDER_ID}, ${TEST_SIREN})
			ON CONFLICT DO NOTHING
		`;
		await sql`
			INSERT INTO app_declaration_lock
				(id, declaration_id, locked_by_user_id, locked_at, last_heartbeat_at, expires_at)
			VALUES
				(gen_random_uuid(), ${id}, ${OTHER_LOCK_HOLDER_ID}, NOW(), NOW(),
				 ${expired ? sql`NOW() - INTERVAL '1 minute'` : sql`NOW() + INTERVAL '30 minutes'`})
			ON CONFLICT (declaration_id) DO UPDATE SET
				locked_by_user_id = EXCLUDED.locked_by_user_id,
				locked_at = EXCLUDED.locked_at,
				last_heartbeat_at = EXCLUDED.last_heartbeat_at,
				expires_at = EXCLUDED.expires_at
		`;
	} finally {
		await sql.end();
	}
}

export async function seedReadableWorkforce(year: number) {
	const sql = connect();
	try {
		const id = await declarationId(sql, year);
		await sql`
			UPDATE app_declaration
			SET total_women = 10, total_men = 15,
				hourly_women = 10, hourly_men = 15
			WHERE id = ${id}
		`;
	} finally {
		await sql.end();
	}
}

export async function clearDeclarationLockFixture(year: number) {
	const sql = connect();
	try {
		await sql`
			DELETE FROM app_declaration_lock
			WHERE declaration_id IN (
				SELECT id FROM app_declaration
				WHERE siren = ${TEST_SIREN} AND year = ${year} AND cancelled_at IS NULL
			)
		`;
		await sql`
			DELETE FROM app_user_company
			WHERE user_id = ${OTHER_LOCK_HOLDER_ID} AND siren = ${TEST_SIREN}
		`;
		await sql`DELETE FROM app_user WHERE id = ${OTHER_LOCK_HOLDER_ID}`;
	} finally {
		await sql.end();
	}
}
