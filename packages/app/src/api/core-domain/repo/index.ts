import { services } from "@common/config";

import type { IDeclarationRepo } from "./IDeclarationRepo";
import { KnexPgDeclarationRepo } from "./impl/KnexPgDeclarationRepo";
import { KnexPgRepresentationEquilibreeRepo } from "./impl/KnexPgRepresentationEquilibreeRepo";
import { PostgresRepresentationEquilibreeRepo } from "./impl/PostgresRepresentationEquilibreeRepo";
import type { IRepresentationEquilibreeRepo } from "./IRepresentationEquilibreeRepo";

let declarationRepo: IDeclarationRepo;
let representationEquilibreeRepo: IRepresentationEquilibreeRepo;
if (services.db === "knex-pg") {
  declarationRepo = new KnexPgDeclarationRepo();
  representationEquilibreeRepo = new KnexPgRepresentationEquilibreeRepo();
} else if (services.db === "postgres") {
  declarationRepo = new KnexPgDeclarationRepo(); // TODO BAD
  representationEquilibreeRepo = new PostgresRepresentationEquilibreeRepo();
}

export { declarationRepo, representationEquilibreeRepo };
