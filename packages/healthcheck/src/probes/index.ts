import type { Sql } from "postgres";

import type { HealthcheckConfig } from "../config.js";
import { createClamavProbe } from "./clamav.js";
import { createIngressProbe } from "./ingress.js";
import { buildJobProbes } from "./jobs/index.js";
import { createPgbossProbe } from "./pgboss.js";
import { createPostgresProbe } from "./postgres.js";
import { createProconnectProbe } from "./proconnect.js";
import { createPublicApiProbe } from "./publicApi.js";
import { createS3Client, createS3Probe } from "./s3.js";
import { createSmtpProbe, createSmtpTransporter } from "./smtp.js";
import { createSuitGatewayProbe } from "./suitGateway.js";
import type { Probe } from "./types.js";
import { createValkeyProbe } from "./valkey.js";
import { createWeezProbe } from "./weez.js";

export function buildProbes(
	config: HealthcheckConfig,
	sql: Sql,
	queueSql: Sql = sql,
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

	probes.push(
		createClamavProbe({
			connection: config.clamav,
			secrets: config.secrets,
			intervalSeconds: config.intervalSeconds,
		}),
		createValkeyProbe({
			url: config.valkeyUrl,
			secrets: config.secrets,
			intervalSeconds: config.intervalSeconds,
		}),
		createSmtpProbe({
			transporter: config.smtp ? createSmtpTransporter(config.smtp) : null,
			secrets: config.secrets,
			intervalSeconds: config.intervalSeconds,
		}),
		createPgbossProbe({
			sql: config.queue ? queueSql : null,
			limits: config.queue,
			secrets: config.secrets,
			intervalSeconds: config.intervalSeconds,
		}),
	);

	// Scheduled jobs: freshness from the traces they wrote, so a CronJob that
	// never started is caught by the absence of a success line.
	probes.push(...buildJobProbes(config, sql, config.queue ? queueSql : null));

	if (!config.partnerProbesEnabled) return probes;

	probes.push(
		createProconnectProbe({
			issuer: config.proconnectIssuer,
			secrets: config.secrets,
			intervalSeconds: config.partnerIntervalSeconds,
		}),
		createWeezProbe({
			connection: config.weez,
			secrets: config.secrets,
			intervalSeconds: config.partnerIntervalSeconds,
		}),
		createIngressProbe({
			publicUrl: config.publicUrl,
			secrets: config.secrets,
			certWarnDays: config.certWarnDays,
			intervalSeconds: config.exposedIntervalSeconds,
		}),
		createPublicApiProbe({
			publicUrl: config.publicUrl,
			secrets: config.secrets,
			intervalSeconds: config.exposedIntervalSeconds,
		}),
		createSuitGatewayProbe({
			connection: config.suitGateway,
			secrets: config.secrets,
			intervalSeconds: config.exposedIntervalSeconds,
		}),
	);

	return probes;
}
