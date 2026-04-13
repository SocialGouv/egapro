import type { Config } from "drizzle-kit";

function getDatabaseUrl() {
	if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

	const {
		POSTGRES_USER,
		POSTGRES_PASSWORD,
		POSTGRES_HOST,
		POSTGRES_PORT,
		POSTGRES_DB,
		POSTGRES_SSLMODE,
	} = process.env;

	if (POSTGRES_HOST && POSTGRES_DB) {
		const user = encodeURIComponent(POSTGRES_USER ?? "postgres");
		const password = POSTGRES_PASSWORD
			? `:${encodeURIComponent(POSTGRES_PASSWORD)}`
			: "";
		const port = POSTGRES_PORT ?? "5432";
		const sslmode = POSTGRES_SSLMODE ? `?sslmode=${POSTGRES_SSLMODE}` : "";
		return `postgresql://${user}${password}@${POSTGRES_HOST}:${port}/${POSTGRES_DB}${sslmode}`;
	}

	throw new Error("DATABASE_URL or POSTGRES_HOST+POSTGRES_DB must be set");
}

export default {
	schema: ["./src/server/db/schema.ts", "./src/server/db/auditSchema.ts"],
	dialect: "postgresql",
	casing: "snake_case",
	dbCredentials: {
		url: getDatabaseUrl(),
	},
	// Multi-project pattern: app tables prefixed `app_*` in `public`,
	// audit table `action_log` lives in the dedicated `audit` schema.
	schemaFilter: ["public", "audit"],
	tablesFilter: ["app_*", "action_log"],
} satisfies Config;
