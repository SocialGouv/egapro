import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), true);

import { sql } from "@api/shared-domain/infra/db/postgres";

import { type Simulation, updateIndicateurUn } from "./migrate-simulations-helpers";

const table = sql("simulation");

console.log("table", table);

export async function migrateSimulations() {
  // On ne s'occupe que des données qui n'ont pas encore la propriété data.indicateurUn.modaliteCalculformValidated, qui sont donc celles avant la migration.
  const rows =
    (await sql`select * from ${table} where data->'indicateurUn'->>'autre' = 'true' and data->'declaration'->>'formValidated' = 'Valid' and not(data->'indicateurUn' ? 'modaliteCalculformValidated')`) as Simulation[];

  console.log("nb rows", rows?.length ?? "no rows");

  rows.forEach(async row => {
    // console.log("row avant", JSON.stringify(row, null, 2));

    console.log("row.id", row.id);

    const newIndicateurUn = updateIndicateurUn(row.data.indicateurUn);

    const newIndicateurUnJson = JSON.stringify(newIndicateurUn).replace(/'/g, "''"); // Need to escape single quotes for Postgres.

    // Postgres.js is not able to handle jsonb_set, so we use sql.unsafe instead.

    // const nbUpdates = await sql`update ${table} set data = jsonb_set(data, '{indicateurUn}', ${sql(
    //   newIndicateurUn,
    // )}) where id = ${row.id}`;

    await sql.unsafe(
      `update simulation set data = jsonb_set(data, '{indicateurUn}', '${newIndicateurUnJson}'::jsonb) where id = '${row.id}'`,
    );
  });
}

migrateSimulations();
