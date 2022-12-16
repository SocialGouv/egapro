import { config } from "@common/config";
import postgres from "postgres";

export const sql = postgres({
  host: config.api.postgres.host,
  port: config.api.postgres.port,
  database: config.api.postgres.db,
  username: config.api.postgres.user,
  password: config.api.postgres.password,
  max: config.api.postgres.poolMaxSize,
  ssl: config.api.postgres.ssl,
});
