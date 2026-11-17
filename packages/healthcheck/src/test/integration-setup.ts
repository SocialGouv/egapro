import {
	PostgreSqlContainer,
	type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

let container: StartedPostgreSqlContainer | undefined;

export async function setup() {
	container = await new PostgreSqlContainer("postgres:17.11").start();
	const databaseUrl = container.getConnectionUri();
	process.env.DATABASE_URL = databaseUrl;

	const migrator = postgres(databaseUrl, { max: 1 });
	try {
		await migrate(drizzle(migrator), {
			migrationsFolder: new URL("../../../app/drizzle", import.meta.url)
				.pathname,
		});
	} finally {
		await migrator.end();
	}
}

export async function teardown() {
	await container?.stop();
}
