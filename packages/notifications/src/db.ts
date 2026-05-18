type PgEnv = {
	host?: string;
	port?: string;
	user?: string;
	password?: string;
	database?: string;
	sslmode?: string;
};

function buildPgUrlFromParts(parts: PgEnv): string | null {
	if (!parts.host || !parts.database) return null;
	const user = encodeURIComponent(parts.user ?? "postgres");
	const password = parts.password
		? `:${encodeURIComponent(parts.password)}`
		: "";
	const port = parts.port ?? "5432";
	const sslmode = parts.sslmode ? `?sslmode=${parts.sslmode}` : "";
	return `postgresql://${user}${password}@${parts.host}:${port}/${parts.database}${sslmode}`;
}

export function resolvePgUrl(
	directUrl: string | undefined,
	prefix: "" | "NOTIFICATIONS_",
): string | null {
	if (directUrl) return directUrl;
	return buildPgUrlFromParts({
		host: process.env[`${prefix}POSTGRES_HOST`],
		port: process.env[`${prefix}POSTGRES_PORT`],
		user: process.env[`${prefix}POSTGRES_USER`],
		password: process.env[`${prefix}POSTGRES_PASSWORD`],
		database: process.env[`${prefix}POSTGRES_DB`],
		sslmode: process.env[`${prefix}POSTGRES_SSLMODE`],
	});
}

// Resolve the connection string used by pg-boss. The dedicated queue DB
// (`NOTIFICATIONS_*`) is preferred — kept isolated from business data on
// preprod / prod. When that secret is absent (typical on review apps),
// fall back to the main app DB so the worker still boots: pg-boss creates
// its own `pgboss` schema, with no collision risk against the app tables.
//
// pg-boss uses node-postgres, which rejects self-signed certs when
// `sslmode=require` (in-cluster pg-rw uses a self-signed cert). Rewrite
// `require` → `no-verify` so pg-connection-string sets
// `ssl: { rejectUnauthorized: false }` itself — the connection stays
// encrypted, only chain verification is relaxed. URL rewriting is the
// only reliable path because the parsed `connectionString` overrides any
// explicit `ssl` Pool option in pg-pool.
export function resolveNotificationsDbUrl(): string | null {
	const url =
		resolvePgUrl(process.env.NOTIFICATIONS_DATABASE_URL, "NOTIFICATIONS_") ??
		resolvePgUrl(process.env.DATABASE_URL, "");
	if (!url) return null;
	return url.replace(
		/([?&])sslmode=(require|prefer|verify-ca|verify-full)/,
		"$1sslmode=no-verify",
	);
}
