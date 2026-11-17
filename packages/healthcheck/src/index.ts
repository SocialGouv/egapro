import postgres from "postgres";

import { type HealthcheckConfig, resolveConfig } from "./config.js";
import { persistProbeResult } from "./persistence.js";
import { createPostgresProbe } from "./probes/postgres.js";
import { createS3Client, createS3Probe } from "./probes/s3.js";
import type { Probe } from "./probes/types.js";
import { sanitizeMessage } from "./sanitize.js";
import { createScheduler, type ProbeScheduler } from "./scheduler.js";
import { toHealthCheckLine, writeHealthCheckLine } from "./stdout.js";

const STATEMENT_TIMEOUT_MS = 5000;

export function buildProbes(
	config: HealthcheckConfig,
	sql: postgres.Sql,
): Probe[] {
	const probes: Probe[] = [
		createPostgresProbe({
			sql,
			secrets: config.secrets,
			intervalSeconds: config.intervalSeconds,
		}),
	];

	if (config.s3) {
		probes.push(
			createS3Probe({
				client: createS3Client(config.s3),
				bucketName: config.s3.bucketName,
				secrets: config.secrets,
				intervalSeconds: config.intervalSeconds,
			}),
		);
	}

	return probes;
}

export async function main(): Promise<void> {
	const config = resolveConfig();
	if (!config.databaseUrl) {
		console.warn(
			"[healthcheck] no DATABASE_URL / POSTGRES_* — worker disabled, exiting",
		);
		return;
	}

	const sql = postgres(config.databaseUrl, {
		max: 2,
		connection: { statement_timeout: STATEMENT_TIMEOUT_MS },
	});

	if (!config.s3) {
		console.warn(
			"[healthcheck] incomplete S3_* configuration — S3 probe disabled",
		);
	}

	const probes = buildProbes(config, sql);
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
	installShutdownHooks(scheduler, sql);
}

function installShutdownHooks(
	scheduler: ProbeScheduler,
	sql: postgres.Sql,
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
			.then(() => sql.end({ timeout: 5 }))
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
