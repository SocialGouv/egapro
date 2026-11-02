import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { db, STATEMENT_TIMEOUT_MS } from "~/server/db";

const QUERY_CANCELED = "57014";

describe("application connection statement_timeout (real Postgres)", () => {
	it("opens every session with the bounded statement_timeout", async () => {
		const [row] = await db.execute<{ setting: string }>(
			sql`SELECT setting FROM pg_settings WHERE name = 'statement_timeout'`,
		);

		expect(row?.setting).toBe(String(STATEMENT_TIMEOUT_MS));
	});

	it(
		"cancels a statement that runs past the timeout",
		async () => {
			const sleepSeconds = STATEMENT_TIMEOUT_MS / 1000 + 2;

			await expect(
				db.execute(sql`SELECT pg_sleep(${sleepSeconds})`),
			).rejects.toMatchObject({ cause: { code: QUERY_CANCELED } });
		},
		STATEMENT_TIMEOUT_MS + 30_000,
	);
});
