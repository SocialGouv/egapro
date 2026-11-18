import type { ClamavConnectionConfig } from "./probes/clamav.js";
import type { S3ConnectionConfig } from "./probes/s3.js";
import type { SmtpConnectionConfig } from "./probes/smtp.js";

const DEFAULT_INTERVAL_SECONDS = 60;
const DEFAULT_QUEUE_MAX_PENDING = 100;
const DEFAULT_QUEUE_MAX_AGE_SECONDS = 900;
const DEFAULT_CLAMAV_PORT = 3310;

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
	intervalSeconds: number;
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
		intervalSeconds: resolveIntervalSeconds(source),
		secrets: compact([
			source.S3_ACCESS_KEY_ID,
			source.S3_SECRET_ACCESS_KEY,
			source.POSTGRES_PASSWORD,
			source.NOTIFICATIONS_POSTGRES_PASSWORD,
			source.SMTP_PASS,
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

function resolveIntervalSeconds(source: NodeJS.ProcessEnv): number {
	return resolvePositiveInteger(
		source.HEALTHCHECK_INTERVAL_SECONDS,
		DEFAULT_INTERVAL_SECONDS,
	);
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
