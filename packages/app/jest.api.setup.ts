// Loaded before test files.
// Ensures `@common/config` resolves Postgres config for the local docker-compose `test_db`.

process.env.NEXT_PUBLIC_EGAPRO_ENV =
  process.env.NEXT_PUBLIC_EGAPRO_ENV ?? "dev";

process.env.POSTGRES_HOST = process.env.POSTGRES_HOST ?? "localhost";
process.env.POSTGRES_PORT = process.env.POSTGRES_PORT ?? "5436";
process.env.POSTGRES_DB = process.env.POSTGRES_DB ?? "test_egapro";
process.env.POSTGRES_USER = process.env.POSTGRES_USER ?? "postgres";
process.env.POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD ?? "postgres";
process.env.POSTGRES_SSLMODE = process.env.POSTGRES_SSLMODE ?? "prefer";

process.env.POSTGRES_POOL_MIN_SIZE = process.env.POSTGRES_POOL_MIN_SIZE ?? "1";
process.env.POSTGRES_POOL_MAX_SIZE = process.env.POSTGRES_POOL_MAX_SIZE ?? "5";
