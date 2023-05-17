import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), true);

import { sql } from "@api/shared-domain/infra/db/postgres";
import { type Any } from "@common/utils/types";
import { inspect } from "util";

import { type Simulation, updateIndicateurUn } from "./migrate-simulations-helpers";

const table = sql("simulation");

/*
select * from ${table}
where (data->'indicateurUn'->>'csp' = 'true' or data->'indicateurUn'->>'modaliteCalcul' = 'csp' or data->'indicateurUn'->>'coef' = 'true' or data->'indicateurUn'->>'modaliteCalcul' = 'coef' or data->'indicateurUn'->>'autre' = 'true' or data->'indicateurUn'->>'modaliteCalcul' = 'autre')
and data->'declaration'->>'formValidated' = 'Valid'
and not(data->'indicateurUn' ? 'modaliteCalculformValidated')`)
*/

export async function migrateSimulations() {
  // On ne s'occupe que des données qui n'ont pas encore la propriété data.indicateurUn.modaliteCalculformValidated, qui sont donc celles avant la migration.
  const rows = (await sql`
        select * from ${table}
        where (data->'indicateurUn' ? 'coefficient')`) as Simulation[];

  console.log("nb rows", rows?.length ?? "no rows");

  for (const row of rows) {
    console.log("row.id", row.id);

    const newIndicateurUn = updateIndicateurUn(row.data.indicateurUn);

    if ((newIndicateurUn as Any)["coefficient"]) {
      console.log("newIndicateurUn:", row.id, inspect(newIndicateurUn, false, Infinity, true));
      throw new Error("should not have coefficient");
    }
    const newData = { ...row.data, indicateurUn: newIndicateurUn };

    const updateData = sql({ data: newData }, "data");

    await sql`update ${table} set ${updateData} where id = ${row.id}`;
  }

  console.log("nb rows", rows?.length ?? "no rows");
}

(async function main() {
  await migrateSimulations();
  console.log("end of script");
})();
