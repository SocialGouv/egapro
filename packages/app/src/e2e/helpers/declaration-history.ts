import postgres from "postgres";
import { TEST_SIREN } from "../constants";

const DEFAULT_DB_URL = "postgresql://postgres:postgres@localhost:5438/egapro";

function createConnection() {
	const url = process.env.DATABASE_URL ?? DEFAULT_DB_URL;
	return postgres(url, { max: 1 });
}

export async function insertHistoryEvents(count: number, year: number) {
	const sql = createConnection();
	try {
		const decl = await sql`
			SELECT id FROM app_declaration WHERE siren = ${TEST_SIREN} AND year = ${year} LIMIT 1
		`;
		const declarationId = decl[0]?.id as string | undefined;
		if (!declarationId) return;

		await sql`DELETE FROM app_declaration_status_history WHERE declaration_id = ${declarationId}`;

		for (let i = 0; i < count; i++) {
			const createdAt = new Date(Date.now() - i * 60_000);
			await sql`
				INSERT INTO app_declaration_status_history
				(id, declaration_id, event_type, created_at)
				VALUES (gen_random_uuid(), ${declarationId}, 'submit', ${createdAt})
			`;
		}
	} finally {
		await sql.end();
	}
}
