import { services } from "@common/config";

import type { IDeclarationRepo } from "./IDeclarationRepo";
import { KnexPgDeclarationRepo } from "./impl/KnexPgDeclarationRepo";
import { KnexPgRepresentationEquilibreeRepo } from "./impl/KnexPgRepresentationEquilibreeRepo";
import type { IRepresentationEquilibreeRepo } from "./IRepresentationEquilibreeRepo";

let declarationRepo: IDeclarationRepo;
let representationEquilibreeRepo: IRepresentationEquilibreeRepo;
if (services.db === "knex-pg") {
  declarationRepo = new KnexPgDeclarationRepo();
  representationEquilibreeRepo = new KnexPgRepresentationEquilibreeRepo();
}

export { declarationRepo, representationEquilibreeRepo };
