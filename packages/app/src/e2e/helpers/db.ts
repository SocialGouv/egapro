import postgres from "postgres";

export const DEFAULT_DB_URL =
	"postgresql://postgres:postgres@localhost:5438/egapro";
export const TEST_SIREN = "130025265";
export const TEST_EMAIL = "test@fia1.fr";

/** Run a callback inside a single DB transaction, then close the connection. */
export async function withDb(
	fn: (sql: postgres.Sql) => Promise<void>,
): Promise<void> {
	const url = process.env.DATABASE_URL ?? DEFAULT_DB_URL;
	const sql = postgres(url, { max: 1 });
	try {
		await sql.begin((tx) => fn(tx as unknown as postgres.Sql));
	} finally {
		await sql.end();
	}
}
