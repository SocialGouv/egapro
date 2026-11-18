import type { Sql } from "postgres";

import type { HealthcheckConfig } from "../config.js";
import { createClamavProbe } from "./clamav.js";
import { createPgbossProbe } from "./pgboss.js";
import { createPostgresProbe } from "./postgres.js";
import { createProconnectProbe } from "./proconnect.js";
import { createS3Client, createS3Probe } from "./s3.js";
import { createSmtpProbe, createSmtpTransporter } from "./smtp.js";
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
	);

	return probes;
}
