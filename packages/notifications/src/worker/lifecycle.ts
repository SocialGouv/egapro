import type { PgBoss } from "pg-boss";
import type { Sql } from "postgres";

import type { HealthServer } from "./health.js";

export type ShutdownDeps = {
	boss: PgBoss;
	mainSql: Sql | null;
	healthServer: HealthServer;
	healthSql: Sql;
};

export function installShutdownHooks({
	boss,
	mainSql,
	healthServer,
	healthSql,
}: ShutdownDeps): void {
	const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
		console.log(`[notifications] received ${signal}, shutting down...`);
		try {
			await boss.stop({ graceful: true, timeout: 15_000 });
			await healthServer.close();
			await healthSql.end({ timeout: 5 });
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
