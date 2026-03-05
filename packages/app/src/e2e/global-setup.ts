import postgres from "postgres";

const TEST_SIREN = "130025265";

/**
 * Playwright global setup: clean up test declaration data before E2E runs.
 *
 * Requires DATABASE_URL to be set (extracted from Kubernetes pg-app secret in CI).
 * Skipped silently when DATABASE_URL is not available (local dev without DB).
 */
export default async function globalSetup() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) return;

	const sql = postgres(databaseUrl);
	try {
		await sql`DELETE FROM app_declaration_category WHERE siren = ${TEST_SIREN}`;
		await sql`DELETE FROM app_declaration WHERE siren = ${TEST_SIREN}`;
		console.log(
			`[global-setup] Cleaned declaration data for SIREN ${TEST_SIREN}`,
		);
	} finally {
		await sql.end();
	}
}
