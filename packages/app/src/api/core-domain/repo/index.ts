import { services } from "@common/config";

import type { IDeclarationRepo } from "./IDeclarationRepo";
import { PostgresDeclarationRepo } from "./impl/PostgresDeclarationRepo";
import { PostgresOwnershipRequestRepo } from "./impl/PostgresOwnershipRequestRepo";
import { PostgresRepresentationEquilibreeRepo } from "./impl/PostgresRepresentationEquilibreeRepo";
import type { IOwnershipRequestRepo } from "./IOwnershipRequestRepo";
import type { IRepresentationEquilibreeRepo } from "./IRepresentationEquilibreeRepo";

let declarationRepo: IDeclarationRepo;
let representationEquilibreeRepo: IRepresentationEquilibreeRepo;
let ownershipRequestRepo: IOwnershipRequestRepo;

if (services.db === "postgres") {
  declarationRepo = new PostgresDeclarationRepo();
  representationEquilibreeRepo = new PostgresRepresentationEquilibreeRepo();
  ownershipRequestRepo = new PostgresOwnershipRequestRepo();
}

export { declarationRepo, ownershipRequestRepo, representationEquilibreeRepo };
