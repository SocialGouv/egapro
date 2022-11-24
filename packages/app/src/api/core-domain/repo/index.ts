import { services } from "@common/config";

import type { IDeclarationRepo } from "./IDeclarationRepo";
import { PostgresDeclarationRepo } from "./impl/PostgresDeclarationRepo";
import { PostgresRepresentationEquilibreeRepo } from "./impl/PostgresRepresentationEquilibreeRepo";
import type { IRepresentationEquilibreeRepo } from "./IRepresentationEquilibreeRepo";

let declarationRepo: IDeclarationRepo;
let representationEquilibreeRepo: IRepresentationEquilibreeRepo;
if (services.db === "postgres") {
  declarationRepo = new PostgresDeclarationRepo();
  representationEquilibreeRepo = new PostgresRepresentationEquilibreeRepo();
}

export { declarationRepo, representationEquilibreeRepo };
