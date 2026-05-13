import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getNotificationsDatabaseUrl() {
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

const url = getNotificationsDatabaseUrl();
const conn = postgres(url, { max: 1 });
const db = drizzle(conn);

console.log("Running Drizzle migrations (notifications DB)...");
await migrate(db, {
	migrationsFolder: path.join(__dirname, "../drizzle-notifications"),
});
console.log("Notifications migrations completed.");

await conn.end();
