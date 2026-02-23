import type { Config } from "drizzle-kit";

function getDatabaseUrl() {
	if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

	const { POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_SSLMODE } =
		process.env;

	if (POSTGRES_HOST && POSTGRES_DB) {
		const user = POSTGRES_USER ?? "postgres";
		const password = POSTGRES_PASSWORD ? `:${POSTGRES_PASSWORD}` : "";
		const port = POSTGRES_PORT ?? "5432";
		const sslmode = POSTGRES_SSLMODE ? `?sslmode=${POSTGRES_SSLMODE}` : "";
		return `postgresql://${user}${password}@${POSTGRES_HOST}:${port}/${POSTGRES_DB}${sslmode}`;
	}

	throw new Error("DATABASE_URL or POSTGRES_HOST+POSTGRES_DB must be set");
}

export default {
	schema: "./src/server/db/schema.ts",
	dialect: "postgresql",
	dbCredentials: {
		url: getDatabaseUrl(),
	},
	tablesFilter: ["app_*"],
} satisfies Config;
