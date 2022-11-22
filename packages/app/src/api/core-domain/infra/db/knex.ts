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
    // SSL connection is required. Please specify SSL options and retry
    ssl: config.api.postgres.ssl
      ? {
          rejectUnauthorized: false,
        }
      : false,
    debug: true,
  },
  seeds: {
    directory: path.resolve(__dirname, "./seeds"),
    recursive: false,
  },
  pool: { min: config.api.postgres.poolMinSize, max: config.api.postgres.poolMaxSize },
};

let DB: Knex | null = null;
export const getDatabase = () => {
  DB ??= knex(knexConfig);

  DB.raw("SELECT 1")
    .then(() => {
      console.log("PostgreSQL connected");
    })
    .catch(e => {
      console.log("PostgreSQL not connected");
      console.error(e);
    });

  return DB;
};

declare module "knex/types/tables" {
  interface Tables {
    declaration: DeclarationRaw;
    representation_equilibree: RepresentationEquilibreeRaw;
  }
}
