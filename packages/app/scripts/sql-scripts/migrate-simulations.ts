import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), true);

import { sql } from "@api/shared-domain/infra/db/postgres";

import { type Simulation, updateIndicateurUn } from "./migrate-simulations-helpers";

const table = sql("simulation");

console.log("table", table);

export async function migrateSimulations() {
  // On ne s'occupe que des données qui n'ont pas encore la propriété data.indicateurUn.modaliteCalculformValidated et qui sont valides, qui sont donc celles avant la migration.
  const rows =
    (await sql`select * from ${table} where  (data->'indicateurUn'->>'csp' = 'true' or data->'indicateurUn'->>'modaliteCalcul' = 'csp' or data->'indicateurUn'->>'coef' = 'true' or data->'indicateurUn'->>'modaliteCalcul' = 'coef' or data->'indicateurUn'->>'autre' = 'true' or data->'indicateurUn'->>'modaliteCalcul' = 'autre') and data->'declaration'->>'formValidated' = 'Valid' and not(data->'indicateurUn' ? 'modaliteCalculformValidated')`) as Simulation[];

  console.log("nb rows", rows?.length ?? "no rows");

  rows.forEach(async row => {
    // console.log("row avant", JSON.stringify(row, null, 2));

    console.log("row.id", row.id);

    const newIndicateurUn = updateIndicateurUn(row.data.indicateurUn);

    // console.log("newIndicateurUn:", JSON.stringify(newIndicateurUn), ":");

    const newIndicateurUnJson = JSON.stringify(newIndicateurUn).replace(/'/g, "''"); // Need to escape single quotes for Postgres.

    // Postgres.js is not able to handle jsonb_set, so we use sql.unsafe instead.

    // const nbUpdates = await sql`update ${table} set data = jsonb_set(data, '{indicateurUn}', ${sql(
    //   newIndicateurUn,
    // )}) where id = ${row.id}`;

    await sql.unsafe(
      `update simulation set data = jsonb_set(data, '{indicateurUn}', '${newIndicateurUnJson}'::jsonb) where id = '${row.id}'`,
    );
  });

  console.log("nb rows", rows?.length ?? "no rows");
}

migrateSimulations();
