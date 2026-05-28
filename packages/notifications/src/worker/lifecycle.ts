import type { PgBoss } from "pg-boss";
import type { Sql } from "postgres";

export type ShutdownDeps = {
	boss: PgBoss;
	mainSql: Sql | null;
};

export function installShutdownHooks({ boss, mainSql }: ShutdownDeps): void {
	const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
		console.log(`[notifications] received ${signal}, shutting down...`);
		try {
			await boss.stop({ graceful: true, timeout: 15_000 });
			if (mainSql) await mainSql.end();
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
