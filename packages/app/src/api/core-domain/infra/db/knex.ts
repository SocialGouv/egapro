import { config } from "@common/config";
import type { Knex } from "knex";
import { knex } from "knex";

import type { DeclarationRaw, RepresentationEquilibreeRaw } from "./raw";

export const knexConfig: Knex.Config = {
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
};

export const DB = knex(knexConfig);

declare module "knex/types/tables" {
  interface Tables {
    declaration: DeclarationRaw;
    representation_equilibree: RepresentationEquilibreeRaw;
  }
}
