import { services } from "@common/config";

import type { IDeclarationRepo } from "./IDeclarationRepo";
import { KnexPgDeclarationRepo } from "./impl/KnexPgDeclarationRepo";

let declarationRepo: IDeclarationRepo;
if (services.db === "knex-pg") {
  declarationRepo = new KnexPgDeclarationRepo();
}

export { declarationRepo };
