import { config } from "@common/config";
import knex from "knex";

import type { DeclarationRaw } from "./raw";

export const DB = knex({
  client: "pg",
  connection: {
    host: config.api.postgres.host,
    port: config.api.postgres.port,
    database: config.api.postgres.db,
    user: config.api.postgres.user,
    password: config.api.postgres.password,
    ssl: config.api.postgres.ssl,
  },
  pool: { min: config.api.postgres.poolMinSize, max: config.api.postgres.poolMaxSize },
});

declare module "knex/types/tables" {
  interface Tables {
    declaration: DeclarationRaw;
  }
}
