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
