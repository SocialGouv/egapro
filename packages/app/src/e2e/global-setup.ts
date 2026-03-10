import postgres from "postgres";

const DEFAULT_URL = "postgresql://postgres:postgres@localhost:5438/egapro";

/** Reset DB state before E2E tests so runs are idempotent. */
export default async function globalSetup() {
	const url = process.env.DATABASE_URL ?? DEFAULT_URL;
	const sql = postgres(url, { max: 1 });
	try {
		await sql`UPDATE app_declaration SET status = 'draft', current_step = 1 WHERE status = 'submitted'`;
	} finally {
		await sql.end();
	}
}
