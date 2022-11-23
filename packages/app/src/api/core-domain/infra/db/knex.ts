import { config } from "@common/config";
import type { Knex } from "knex";
import { knex } from "knex";
import path from "path";
import { defaults } from "pg";

import type { DeclarationRaw, RepresentationEquilibreeRaw } from "./raw";

if (config.api.postgres.ssl) {
  defaults.ssl = true;
}

export const knexConfig: Knex.Config = {
  client: "pg",
  connection: {
    host: config.api.postgres.host,
    port: config.api.postgres.port,
    database: config.api.postgres.db,
    user: config.api.postgres.user,
    password: config.api.postgres.password,
    ssl: config.api.postgres.ssl,
    debug: true,
  },
  seeds: {
    directory: path.resolve(__dirname, "./seeds"),
    recursive: false,
  },
  pool: { min: config.api.postgres.poolMinSize, max: config.api.postgres.poolMaxSize },
};

let DB: Knex | null = null;
export const getDatabase = () => (DB ??= knex(knexConfig));

declare module "knex/types/tables" {
  interface Tables {
    declaration: DeclarationRaw;
    representation_equilibree: RepresentationEquilibreeRaw;
  }
}
