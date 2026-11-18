import type { PgBoss } from "pg-boss";
import type { Sql } from "postgres";

import type { HealthServer } from "./health.js";

export type ShutdownDeps = {
	boss: PgBoss;
	mainSql: Sql | null;
	/** Absent when `NOTIFICATIONS_HEALTH_PORT` is unset — nothing to close. */
	health: { server: HealthServer; sql: Sql } | null;
};

export function installShutdownHooks({ boss, mainSql, health }: ShutdownDeps) {
	const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
		console.log(`[notifications] received ${signal}, shutting down...`);
		try {
			await boss.stop({ graceful: true, timeout: 15_000 });
			if (health) {
				await health.server.close();
				await health.sql.end({ timeout: 5 });
			}
			if (mainSql) await mainSql.end({ timeout: 5 });
		} catch (error) {
			console.error("[notifications] shutdown error:", error);
		}
		process.exit(0);
	};
	process.on("SIGTERM", () => {
		void shutdown("SIGTERM");
	});
	process.on("SIGINT", () => {
		void shutdown("SIGINT");
	});
}
