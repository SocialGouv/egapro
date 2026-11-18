import postgres from "postgres";

import { type HealthcheckConfig, resolveConfig } from "./config.js";
import { persistProbeResult } from "./persistence.js";
import { buildProbes } from "./probes/index.js";
import { sanitizeMessage } from "./sanitize.js";
import { createScheduler, type ProbeScheduler } from "./scheduler.js";
import { toHealthCheckLine, writeHealthCheckLine } from "./stdout.js";

const STATEMENT_TIMEOUT_MS = 5000;

export { buildProbes };

export async function main(): Promise<void> {
	const config = resolveConfig();
	if (!config.databaseUrl) {
		console.warn(
			"[healthcheck] no DATABASE_URL / POSTGRES_* — worker disabled, exiting",
		);
		return;
	}

	const sql = createSqlClient(config.databaseUrl);
	const queueSql =
		config.queue && config.queue.databaseUrl !== config.databaseUrl
			? createSqlClient(config.queue.databaseUrl)
			: sql;

	logDisabledProbes(config);

	const probes = buildProbes(config, sql, queueSql);
	const scheduler = createScheduler({
		probes,
		async onResult(probe, result, checkedAt) {
			writeHealthCheckLine(
				toHealthCheckLine({ probeKey: probe.key, result, checkedAt }),
			);
			await persistProbeResult(sql, { probe, result, checkedAt });
		},
		onError(probe, error) {
			console.error(
				`[healthcheck] ${probe.key} result not persisted: ${sanitizeMessage(error, config.secrets)}`,
			);
		},
	});

	console.log(
		`[healthcheck] started (probes=${probes.map((probe) => probe.key).join(",")}, interval=${config.intervalSeconds}s)`,
	);
	scheduler.start();
	installShutdownHooks(scheduler, [sql, queueSql]);
}

function createSqlClient(databaseUrl: string): postgres.Sql {
	return postgres(databaseUrl, {
		max: 2,
		connection: { statement_timeout: STATEMENT_TIMEOUT_MS },
	});
}

function logDisabledProbes(config: HealthcheckConfig): void {
	if (!config.s3) {
		console.warn(
			"[healthcheck] incomplete S3_* configuration — S3 probe disabled",
		);
	}
	if (!config.clamav) {
		console.warn("[healthcheck] no CLAMAV_HOST — ClamAV probe not configured");
	}
	if (!config.valkeyUrl) {
		console.warn("[healthcheck] no VALKEY_URL — Valkey probe not configured");
	}
	if (!config.smtp) {
		console.warn(
			"[healthcheck] MAIL_ENABLED=false or SMTP_HOST missing — SMTP probe not configured",
		);
	}
}

function installShutdownHooks(
	scheduler: ProbeScheduler,
	clients: readonly postgres.Sql[],
): void {
	let stopping = false;

	const stop = (signal: NodeJS.Signals) => {
		if (stopping) {
			process.exit(1);
		}
		stopping = true;
		console.log(`[healthcheck] ${signal} received, stopping`);
		scheduler
			.stop()
			.then(() =>
				Promise.allSettled(
					[...new Set(clients)].map((client) => client.end({ timeout: 5 })),
				),
			)
			.then(
				() => process.exit(0),
				() => process.exit(1),
			);
	};

	process.on("SIGTERM", stop);
	process.on("SIGINT", stop);
}

const isCli = (() => {
	const entry = process.argv[1];
	if (!entry) return false;
	return (
		import.meta.url === `file://${entry}` ||
		entry.endsWith("packages/healthcheck/src/index.ts") ||
		entry.endsWith("packages/healthcheck/dist/index.js")
	);
})();

if (isCli) {
	main().catch((error: unknown) => {
		console.error(
			`[healthcheck] fatal: ${sanitizeMessage(error, resolveConfig().secrets)}`,
		);
		process.exit(1);
	});
}
