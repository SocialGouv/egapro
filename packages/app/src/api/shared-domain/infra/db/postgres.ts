import { config } from "@common/config";
import postgres from "postgres";

console.log("DEBUG: POSTGRES_HOST =", process.env.POSTGRES_HOST);
console.log("DEBUG: PGHOST =", process.env.PGHOST);
console.log("DEBUG: config.api.postgres.host =", config.api.postgres.host);

export const sql = postgres({
  debug: true,
  host: config.api.postgres.host,
  port: config.api.postgres.port,
  database: config.api.postgres.db,
  username: config.api.postgres.user,
  password: config.api.postgres.password,
  max: config.api.postgres.poolMaxSize,
  ssl: config.api.postgres.ssl,
});
