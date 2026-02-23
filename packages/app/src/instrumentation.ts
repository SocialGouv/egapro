import * as Sentry from "@sentry/nextjs";

export async function register() {
	if (process.env.NEXT_RUNTIME === "nodejs") {
		await import("../sentry.server.config");

		const { migrate } = await import("drizzle-orm/postgres-js/migrator");
		const { db } = await import("~/server/db");
		const fs = await import("node:fs");
		const path = await import("node:path");
		const cwd = process.cwd();
		// In standalone Docker, cwd is /app and migrations are at packages/app/drizzle
		// In local dev, cwd is packages/app and migrations are at drizzle
		const migrationsFolder = fs.existsSync(path.join(cwd, "drizzle"))
			? path.join(cwd, "drizzle")
			: path.join(cwd, "packages/app/drizzle");
		await migrate(db, { migrationsFolder });
	}

	if (process.env.NEXT_RUNTIME === "edge") {
		await import("../sentry.edge.config");
	}
}

export const onRequestError = Sentry.captureRequestError;
