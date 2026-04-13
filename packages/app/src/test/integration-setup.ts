import {
	PostgreSqlContainer,
	type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

/**
 * Vitest `globalSetup` — starts a disposable Postgres container for the whole
 * integration test run, applies the real Drizzle migrations, and exposes the
 * connection URI via `process.env.DATABASE_URL` so that any subsequent import
 * of `~/server/db` connects to this fresh database.
 *
 * Why a container and not the existing local `egapro-db-1`:
 *  - The tests rewrite tables (insert / delete) and we do NOT want to touch
 *    the developer's dev database.
 *  - Each CI job gets a clean slate so assertions on row counts are reliable.
 *
 * Cost: starting a Postgres 16 container takes ~5–10 s. This runs once per
 * `vitest run --config vitest.integration.config.ts` invocation, not once
 * per test file.
 */

let container: StartedPostgreSqlContainer | undefined;

export async function setup() {
	container = await new PostgreSqlContainer("postgres:16").start();
	const databaseUrl = container.getConnectionUri();

	// Bypass Zod env validation — the integration tests only need DATABASE_URL,
	// every other server var is irrelevant here. This must happen BEFORE any
	// test file imports `~/env`.
	process.env.SKIP_ENV_VALIDATION = "1";
	process.env.DATABASE_URL = databaseUrl;

	// Apply the real migrations against the fresh container. We use a throw-
	// away drizzle instance so the main app `db` singleton (which will be
	// created on first import) sees a fully-migrated schema.
	const migrator = postgres(databaseUrl, { max: 1 });
	try {
		await migrate(drizzle(migrator), { migrationsFolder: "./drizzle" });
	} finally {
		await migrator.end();
	}
}

export async function teardown() {
	await container?.stop();
}
