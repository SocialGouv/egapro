import type { ClamavConnectionConfig } from "./probes/clamav.js";
import type { S3ConnectionConfig } from "./probes/s3.js";
import type { SmtpConnectionConfig } from "./probes/smtp.js";
import type { SuitGatewayConfig } from "./probes/suitGateway.js";
import type { WeezConnectionConfig } from "./probes/weez.js";

const DEFAULT_INTERVAL_SECONDS = 60;
const DEFAULT_PARTNER_INTERVAL_SECONDS = 900;
const DEFAULT_EXPOSED_INTERVAL_SECONDS = 300;
const DEFAULT_CERT_WARN_DAYS = 30;
const DEFAULT_QUEUE_MAX_PENDING = 100;
export const DEFAULT_QUEUE_MAX_AGE_SECONDS = 900;
const DEFAULT_CLAMAV_PORT = 3310;
const DEFAULT_JOB_STALE_HOURS = 26;
const DEFAULT_ALERT_AFTER_FAILURES = 3;

export type AlertsConfig = {
	/** Absent means alerts are disabled: no request is attempted. */
	mattermostWebhookUrl: string | null;
	/**
	 * Base URL of the back-office screen linked from every alert. Falls back to
	 * the public entrypoint, which is the same host in every namespace.
	 */
	adminUrl: string | null;
	/** Consecutive failures before a `critical` / `important` probe alerts. */
	alertAfterFailures: number;
};

export type QueueConfig = {
	databaseUrl: string;
	maxPending: number;
	maxAgeSeconds: number;
};

export type HealthcheckConfig = {
	databaseUrl: string | null;
	s3: S3ConnectionConfig | null;
	clamav: ClamavConnectionConfig | null;
	valkeyUrl: string | null;
	smtp: SmtpConnectionConfig | null;
	queue: QueueConfig | null;
	proconnectIssuer: string | null;
	weez: WeezConnectionConfig | null;
	publicUrl: string | null;
	suitGateway: SuitGatewayConfig | null;
	certWarnDays: number;
	partnerProbesEnabled: boolean;
	intervalSeconds: number;
	partnerIntervalSeconds: number;
	exposedIntervalSeconds: number;
	/**
	 * Floor of the staleness window for scheduled jobs: 24 h plus 2 h of margin
	 * absorbs a scheduler delay. A less frequent cron widens it to its own
	 * period, so a monthly or yearly job is not red for the rest of the year.
	 */
	jobStaleHours: number;
	alerts: AlertsConfig;
	secrets: readonly string[];
};

export function resolveConfig(
	source: NodeJS.ProcessEnv = process.env,
): HealthcheckConfig {
	const queueDatabaseUrl =
		resolveDatabaseUrl(source, "NOTIFICATIONS_") ?? resolveDatabaseUrl(source);

	return {
		databaseUrl: resolveDatabaseUrl(source),
		s3: resolveS3(source),
		clamav: resolveClamav(source),
		valkeyUrl: source.VALKEY_URL || null,
		smtp: resolveSmtp(source),
		queue: queueDatabaseUrl
			? {
					databaseUrl: queueDatabaseUrl,
					maxPending: resolvePositiveInteger(
						source.HEALTHCHECK_QUEUE_MAX_PENDING,
						DEFAULT_QUEUE_MAX_PENDING,
					),
					maxAgeSeconds: resolvePositiveInteger(
						source.HEALTHCHECK_QUEUE_MAX_AGE_SECONDS,
						DEFAULT_QUEUE_MAX_AGE_SECONDS,
					),
				}
			: null,
		proconnectIssuer: source.EGAPRO_PROCONNECT_ISSUER || null,
		weez: resolveWeez(source),
		publicUrl: source.HEALTHCHECK_PUBLIC_URL || null,
		suitGateway: resolveSuitGateway(source),
		certWarnDays: resolvePositiveInteger(
			source.HEALTHCHECK_CERT_WARN_DAYS,
			DEFAULT_CERT_WARN_DAYS,
		),
		partnerProbesEnabled:
			(source.HEALTHCHECK_PARTNER_PROBES_ENABLED ?? "false").toLowerCase() ===
			"true",
		intervalSeconds: resolveIntervalSeconds(
			source,
			"HEALTHCHECK_INTERVAL_SECONDS",
			DEFAULT_INTERVAL_SECONDS,
		),
		partnerIntervalSeconds: resolveIntervalSeconds(
			source,
			"HEALTHCHECK_PARTNER_INTERVAL_SECONDS",
			DEFAULT_PARTNER_INTERVAL_SECONDS,
		),
		exposedIntervalSeconds: resolveIntervalSeconds(
			source,
			"HEALTHCHECK_EXPOSED_INTERVAL_SECONDS",
			DEFAULT_EXPOSED_INTERVAL_SECONDS,
		),
		jobStaleHours: resolvePositiveInteger(
			source.HEALTHCHECK_JOB_STALE_HOURS,
			DEFAULT_JOB_STALE_HOURS,
		),
		alerts: resolveAlerts(source),
		secrets: compact([
			source.S3_ACCESS_KEY_ID,
			source.S3_SECRET_ACCESS_KEY,
			source.POSTGRES_PASSWORD,
			source.NOTIFICATIONS_POSTGRES_PASSWORD,
			source.SMTP_PASS,
			source.HEALTHCHECK_APISIX_SUIT_API_KEY,
			source.HEALTHCHECK_MATTERMOST_WEBHOOK_URL,
		]),
	};
}

// Same DSN assembly as the app (src/env.js) and the notifications worker: the
// pod receives discrete POSTGRES_* keys from the `pg-app` secret, and neither
// of the two Next-free workers can import the other's copy.
function resolveDatabaseUrl(
	source: NodeJS.ProcessEnv,
	prefix: "" | "NOTIFICATIONS_" = "",
): string | null {
	const directUrl = source[`${prefix}DATABASE_URL`];
	if (directUrl) return directUrl;

	const host = source[`${prefix}POSTGRES_HOST`];
	const database = source[`${prefix}POSTGRES_DB`];
	if (!host || !database) return null;

	const user = encodeURIComponent(
		source[`${prefix}POSTGRES_USER`] ?? "postgres",
	);
	const rawPassword = source[`${prefix}POSTGRES_PASSWORD`];
	const password = rawPassword ? `:${encodeURIComponent(rawPassword)}` : "";
	const port = source[`${prefix}POSTGRES_PORT`] ?? "5432";
	const sslmode = source[`${prefix}POSTGRES_SSLMODE`]
		? `?sslmode=${source[`${prefix}POSTGRES_SSLMODE`]}`
		: "";

	return `postgresql://${user}${password}@${host}:${port}/${database}${sslmode}`;
}

function resolveS3(source: NodeJS.ProcessEnv): S3ConnectionConfig | null {
	const { S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } =
		source;
	const bucketName = source.S3_BUCKET_NAME;

	if (
		!S3_ENDPOINT ||
		!S3_REGION ||
		!S3_ACCESS_KEY_ID ||
		!S3_SECRET_ACCESS_KEY ||
		!bucketName
	) {
		return null;
	}

	return {
		endpoint: S3_ENDPOINT,
		region: S3_REGION,
		accessKeyId: S3_ACCESS_KEY_ID,
		secretAccessKey: S3_SECRET_ACCESS_KEY,
		bucketName,
	};
}

function resolveClamav(
	source: NodeJS.ProcessEnv,
): ClamavConnectionConfig | null {
	const host = source.CLAMAV_HOST;
	if (!host) return null;

	return {
		host,
		port: resolvePositiveInteger(source.CLAMAV_PORT, DEFAULT_CLAMAV_PORT),
	};
}

function resolveSmtp(source: NodeJS.ProcessEnv): SmtpConnectionConfig | null {
	const enabled = (source.MAIL_ENABLED ?? "false").toLowerCase() === "true";
	const host = source.SMTP_HOST;
	if (!enabled || !host) return null;

	return {
		host,
		port: resolvePositiveInteger(source.SMTP_PORT, 1025),
		secure: (source.SMTP_SECURE ?? "false").toLowerCase() === "true",
		user: source.SMTP_USER || undefined,
		pass: source.SMTP_PASS || undefined,
	};
}

function resolveWeez(source: NodeJS.ProcessEnv): WeezConnectionConfig | null {
	const apiUrl = source.EGAPRO_WEEZ_API_URL;
	const referenceSiren = source.HEALTHCHECK_WEEZ_REFERENCE_SIREN;
	if (!apiUrl || !referenceSiren) return null;

	return { apiUrl, referenceSiren };
}

function resolveSuitGateway(
	source: NodeJS.ProcessEnv,
): SuitGatewayConfig | null {
	const baseUrl = source.HEALTHCHECK_APISIX_SUIT_URL;
	const apiKey = source.HEALTHCHECK_APISIX_SUIT_API_KEY;
	if (!baseUrl || !apiKey) return null;

	return { baseUrl, apiKey };
}

function resolveAlerts(source: NodeJS.ProcessEnv): AlertsConfig {
	return {
		mattermostWebhookUrl: source.HEALTHCHECK_MATTERMOST_WEBHOOK_URL || null,
		adminUrl:
			source.HEALTHCHECK_ADMIN_URL || source.HEALTHCHECK_PUBLIC_URL || null,
		alertAfterFailures: resolvePositiveInteger(
			source.HEALTHCHECK_ALERT_AFTER_FAILURES,
			DEFAULT_ALERT_AFTER_FAILURES,
		),
	};
}

function resolveIntervalSeconds(
	source: NodeJS.ProcessEnv,
	variable: string,
	fallback: number,
): number {
	return resolvePositiveInteger(source[variable], fallback);
}

function resolvePositiveInteger(
	value: string | undefined,
	fallback: number,
): number {
	const parsed = Number.parseInt(value ?? "", 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function compact(values: readonly (string | undefined)[]): string[] {
	return values.filter(
		(value): value is string => typeof value === "string" && value.length > 0,
	);
}
