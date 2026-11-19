import postgres from "postgres";

import { type HealthcheckConfig, resolveConfig } from "./config.js";
import { createMattermostNotifier } from "./notify/mattermost.js";
import { decideNotification } from "./notify/policy.js";
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
	await logReceiptOutboxGap(sql);

	const notifier = createNotifier(config);
	const probes = buildProbes(config, sql, queueSql);
	const scheduler = createScheduler({
		probes,
		async onResult(probe, result, checkedAt) {
			writeHealthCheckLine(
				toHealthCheckLine({ probeKey: probe.key, result, checkedAt }),
			);
			const { plan, previous } = await persistProbeResult(sql, {
				probe,
				result,
				checkedAt,
			});
			if (!notifier) return;

			const notification = decideNotification({
				probe,
				status: plan.status,
				consecutiveFailures: plan.consecutiveFailures,
				latencyMs: result.latencyMs,
				message: result.message,
				nextExpectedAt: result.nextExpectedAt,
				checkedAt,
				// The outage start, not the last check: a recovery reports how
				// long it was down, and the threshold alert reports the same.
				statusSince:
					previous && previous.status !== "operational"
						? previous.changedAt
						: checkedAt,
				previous,
				alertAfterFailures: config.alerts.alertAfterFailures,
			});
			if (notification) await notifier.notify(notification);
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

function createNotifier(config: HealthcheckConfig) {
	const webhookUrl = config.alerts.mattermostWebhookUrl;
	if (!webhookUrl) return null;
	return createMattermostNotifier({
		webhookUrl,
		adminUrl: config.alerts.adminUrl,
		secrets: config.secrets,
	});
}

function logDisabledProbes(config: HealthcheckConfig): void {
	if (!config.alerts.mattermostWebhookUrl) {
		console.warn(
			"[healthcheck] no HEALTHCHECK_MATTERMOST_WEBHOOK_URL — Mattermost alerts disabled",
		);
	} else if (!config.alerts.adminUrl) {
		console.warn(
			"[healthcheck] no HEALTHCHECK_ADMIN_URL or HEALTHCHECK_PUBLIC_URL — alert messages will carry no screen link",
		);
	}
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
	if (!config.proconnectIssuer) {
		console.warn(
			"[healthcheck] no EGAPRO_PROCONNECT_ISSUER — ProConnect probe not configured",
		);
	}
	if (!config.weez) {
		console.warn(
			"[healthcheck] EGAPRO_WEEZ_API_URL or HEALTHCHECK_WEEZ_REFERENCE_SIREN missing — WEEZ probe not configured",
		);
	}
	if (!config.partnerProbesEnabled) {
		console.warn(
			"[healthcheck] HEALTHCHECK_PARTNER_PROBES_ENABLED is false — partner and exposed probes not scheduled",
		);
	}
	if (!config.publicUrl) {
		console.warn(
			"[healthcheck] no HEALTHCHECK_PUBLIC_URL — ingress and public API probes not configured",
		);
	}
	if (!config.suitGateway) {
		console.warn(
			"[healthcheck] HEALTHCHECK_APISIX_SUIT_URL or HEALTHCHECK_APISIX_SUIT_API_KEY missing — SUIT gateway probe not configured",
		);
	}
}

/**
 * The receipt replay probe (#4546) is out of scope here: its source table does
 * not exist in the schema at implementation time. Trace the gap at boot so the
 * absence is a logged decision, not a forgotten probe — the runbook covers it.
 */
async function logReceiptOutboxGap(sql: postgres.Sql): Promise<void> {
	try {
		const rows = await sql<{ present: boolean }[]>`
			SELECT to_regclass('public.app_receipt_outbox') IS NOT NULL AS present
		`;
		if (!rows[0]?.present) {
			console.warn(
				"[healthcheck] app_receipt_outbox absent — sonde de rejeu des accusés non planifiée",
			);
		}
	} catch (error) {
		console.warn(
			`[healthcheck] app_receipt_outbox check skipped: ${sanitizeMessage(error)}`,
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
