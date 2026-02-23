import postgres from "postgres";

function getDatabaseUrl() {
	if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

	const { POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_PORT, POSTGRES_DB, POSTGRES_SSLMODE } =
		process.env;

	if (POSTGRES_HOST && POSTGRES_DB) {
		const user = POSTGRES_USER ?? "postgres";
		const password = POSTGRES_PASSWORD ? `:${POSTGRES_PASSWORD}` : "";
		const port = POSTGRES_PORT ?? "5432";
		const sslmode = POSTGRES_SSLMODE ? `?sslmode=${POSTGRES_SSLMODE}` : "";
		return `postgresql://${user}${password}@${POSTGRES_HOST}:${port}/${POSTGRES_DB}${sslmode}`;
	}

	throw new Error("DATABASE_URL or POSTGRES_HOST+POSTGRES_DB must be set");
}

const sql = postgres(getDatabaseUrl(), { max: 1 });

console.log("Running database migrations...");

await sql.unsafe(`
	CREATE TABLE IF NOT EXISTS "app_user" (
		"id" varchar(255) PRIMARY KEY NOT NULL,
		"name" varchar(255),
		"email" varchar(255) NOT NULL,
		"emailVerified" timestamptz DEFAULT now(),
		"image" varchar(255)
	);

	CREATE TABLE IF NOT EXISTS "app_account" (
		"userId" varchar(255) NOT NULL REFERENCES "app_user"("id"),
		"type" varchar(255) NOT NULL,
		"provider" varchar(255) NOT NULL,
		"providerAccountId" varchar(255) NOT NULL,
		"refresh_token" text,
		"access_token" text,
		"expires_at" integer,
		"token_type" varchar(255),
		"scope" varchar(255),
		"id_token" text,
		"session_state" varchar(255),
		CONSTRAINT "app_account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
	);
	CREATE INDEX IF NOT EXISTS "account_user_id_idx" ON "app_account" ("userId");

	CREATE TABLE IF NOT EXISTS "app_session" (
		"sessionToken" varchar(255) PRIMARY KEY NOT NULL,
		"userId" varchar(255) NOT NULL REFERENCES "app_user"("id"),
		"expires" timestamptz NOT NULL
	);
	CREATE INDEX IF NOT EXISTS "t_user_id_idx" ON "app_session" ("userId");

	CREATE TABLE IF NOT EXISTS "app_verification_token" (
		"identifier" varchar(255) NOT NULL,
		"token" varchar(255) NOT NULL,
		"expires" timestamptz NOT NULL,
		CONSTRAINT "app_verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
	);
`);

console.log("Database migrations completed.");
await sql.end();
