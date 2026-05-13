import type { Config } from "drizzle-kit";

function getDatabaseUrl() {
	if (process.env.NOTIFICATIONS_DATABASE_URL)
		return process.env.NOTIFICATIONS_DATABASE_URL;

	const {
		NOTIFICATIONS_POSTGRES_USER,
		NOTIFICATIONS_POSTGRES_PASSWORD,
		NOTIFICATIONS_POSTGRES_HOST,
		NOTIFICATIONS_POSTGRES_PORT,
		NOTIFICATIONS_POSTGRES_DB,
		NOTIFICATIONS_POSTGRES_SSLMODE,
	} = process.env;

	if (NOTIFICATIONS_POSTGRES_HOST && NOTIFICATIONS_POSTGRES_DB) {
		const user = encodeURIComponent(NOTIFICATIONS_POSTGRES_USER ?? "postgres");
		const password = NOTIFICATIONS_POSTGRES_PASSWORD
			? `:${encodeURIComponent(NOTIFICATIONS_POSTGRES_PASSWORD)}`
			: "";
		const port = NOTIFICATIONS_POSTGRES_PORT ?? "5432";
		const sslmode = NOTIFICATIONS_POSTGRES_SSLMODE
			? `?sslmode=${NOTIFICATIONS_POSTGRES_SSLMODE}`
			: "";
		return `postgresql://${user}${password}@${NOTIFICATIONS_POSTGRES_HOST}:${port}/${NOTIFICATIONS_POSTGRES_DB}${sslmode}`;
	}

	throw new Error(
		"NOTIFICATIONS_DATABASE_URL or NOTIFICATIONS_POSTGRES_HOST+NOTIFICATIONS_POSTGRES_DB must be set",
	);
}

export default {
	schema: "./src/server/notifications/db/schema.ts",
	out: "./drizzle-notifications",
	dialect: "postgresql",
	casing: "snake_case",
	dbCredentials: {
		url: getDatabaseUrl(),
	},
	schemaFilter: ["public"],
	tablesFilter: ["notification_*"],
} satisfies Config;
