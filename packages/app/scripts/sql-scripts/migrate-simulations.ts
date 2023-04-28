import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), true);

import { sql } from "@api/shared-domain/infra/db/postgres";

import { type Simulation, updateIndicateurUn } from "./migrate-simulations-helpers";

const table = sql("simulation");

console.log("table", table);

export async function migrateSimulations() {
  // On ne s'occupe que des données qui n'ont pas encore la propriété data.indicateurUn.modaliteCalculformValidated, qui sont donc celles avant la migration.
  const rows =
    (await sql`select * from ${table} where data->'declaration'->>'formValidated' = 'Valid' and not(data->'indicateurUn' ? 'modaliteCalculformValidated') limit 1`) as Simulation[];

  console.log("nb rows", rows?.length ?? "no rows");

  rows.forEach(row => {
    const newIndicateurUn = updateIndicateurUn(row.data.indicateurUn);
    // Update sql with new data.
    sql`update ${table} set data = jsonb_set(data, '{indicateurUn}', ${JSON.stringify(
      newIndicateurUn,
    )}::jsonb) where id = ${row.id}`;
  });
}

migrateSimulations();
