import type { S3ConnectionConfig } from "./probes/s3.js";

const DEFAULT_INTERVAL_SECONDS = 60;

export type HealthcheckConfig = {
	databaseUrl: string | null;
	s3: S3ConnectionConfig | null;
	intervalSeconds: number;
	secrets: readonly string[];
};

export function resolveConfig(
	source: NodeJS.ProcessEnv = process.env,
): HealthcheckConfig {
	return {
		databaseUrl: resolveDatabaseUrl(source),
		s3: resolveS3(source),
		intervalSeconds: resolveIntervalSeconds(source),
		secrets: compact([
			source.S3_ACCESS_KEY_ID,
			source.S3_SECRET_ACCESS_KEY,
			source.POSTGRES_PASSWORD,
		]),
	};
}

// Same DSN assembly as the app (src/env.js) and the notifications worker: the
// pod receives discrete POSTGRES_* keys from the `pg-app` secret, and neither
// of the two Next-free workers can import the other's copy.
function resolveDatabaseUrl(source: NodeJS.ProcessEnv): string | null {
	if (source.DATABASE_URL) return source.DATABASE_URL;

	const { POSTGRES_HOST, POSTGRES_DB } = source;
	if (!POSTGRES_HOST || !POSTGRES_DB) return null;

	const user = encodeURIComponent(source.POSTGRES_USER ?? "postgres");
	const password = source.POSTGRES_PASSWORD
		? `:${encodeURIComponent(source.POSTGRES_PASSWORD)}`
		: "";
	const port = source.POSTGRES_PORT ?? "5432";
	const sslmode = source.POSTGRES_SSLMODE
		? `?sslmode=${source.POSTGRES_SSLMODE}`
		: "";

	return `postgresql://${user}${password}@${POSTGRES_HOST}:${port}/${POSTGRES_DB}${sslmode}`;
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

function resolveIntervalSeconds(source: NodeJS.ProcessEnv): number {
	const parsed = Number.parseInt(source.HEALTHCHECK_INTERVAL_SECONDS ?? "", 10);
	return Number.isFinite(parsed) && parsed > 0
		? parsed
		: DEFAULT_INTERVAL_SECONDS;
}

function compact(values: readonly (string | undefined)[]): string[] {
	return values.filter(
		(value): value is string => typeof value === "string" && value.length > 0,
	);
}
