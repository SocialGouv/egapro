import { services } from "@common/config";

import type { IDeclarationRepo } from "./IDeclarationRepo";
import { PostgresDeclarationRepo } from "./impl/PostgresDeclarationRepo";
import { PostgresOwnershipRepo } from "./impl/PostgresOwnershipRepo";
import { PostgresRepresentationEquilibreeRepo } from "./impl/PostgresRepresentationEquilibreeRepo";
import type { IOwnershipRepo } from "./IOwnershipRepo";
import type { IRepresentationEquilibreeRepo } from "./IRepresentationEquilibreeRepo";

export let declarationRepo: IDeclarationRepo;
export let representationEquilibreeRepo: IRepresentationEquilibreeRepo;
export let ownershipRepo: IOwnershipRepo;

if (services.db === "postgres") {
  declarationRepo = new PostgresDeclarationRepo();
  representationEquilibreeRepo = new PostgresRepresentationEquilibreeRepo();
  ownershipRepo = new PostgresOwnershipRepo();
}
