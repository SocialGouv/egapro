import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd(), true);

import { db } from "@api/shared-domain/infra/db/drizzle";
import { simulation } from "@api/shared-domain/infra/db/schema";
import { type Any } from "@common/utils/types";
import { eq, sql } from "drizzle-orm";
import { inspect } from "util";

import {
  type Simulation,
  updateIndicateurUn,
} from "./migrate-simulations-helpers";

/*
select * from ${table}
where (data->'indicateurUn'->>'csp' = 'true' or data->'indicateurUn'->>'modaliteCalcul' = 'csp' or data->'indicateurUn'->>'coef' = 'true' or data->'indicateurUn'->>'modaliteCalcul' = 'coef' or data->'indicateurUn'->>'autre' = 'true' or data->'indicateurUn'->>'modaliteCalcul' = 'autre')
and data->'declaration'->>'formValidated' = 'Valid'
and not(data->'indicateurUn' ? 'modaliteCalculformValidated')`)
*/

export async function migrateSimulations() {
  // On ne s'occupe que des données qui n'ont pas encore la propriété data.indicateurUn.modaliteCalculformValidated, qui sont donc celles avant la migration.
  const rows = (await db.execute(sql`
    select * from ${simulation}
    where (data->'indicateurUn' ? 'coefficient')
  `)) as unknown as Simulation[];

  console.log("nb rows", rows?.length ?? "no rows");

  for (const row of rows) {
    console.log("row.id", row.id);

    const newIndicateurUn = updateIndicateurUn(row.data.indicateurUn);

    if ((newIndicateurUn as Any)["coefficient"]) {
      console.log(
        "newIndicateurUn:",
        row.id,
        inspect(newIndicateurUn, false, Infinity, true),
      );
      throw new Error("should not have coefficient");
    }
    const newData = { ...row.data, indicateurUn: newIndicateurUn };

    await db
      .update(simulation)
      .set({ data: newData } as Any)
      .where(eq(simulation.id, row.id as Any));
  }

  console.log("nb rows", rows?.length ?? "no rows");
}

(async function main() {
  await migrateSimulations();
  console.log("end of script");
})();
