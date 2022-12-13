import { services } from "@common/config";

import type { IDeclarationRepo } from "./IDeclarationRepo";
import { PostgresDeclarationRepo } from "./impl/PostgresDeclarationRepo";
import { PostgresOwnershipRepo } from "./impl/PostgresOwnershipRepo";
import { PostgresOwnershipRequestRepo } from "./impl/PostgresOwnershipRequestRepo";
import { PostgresRepresentationEquilibreeRepo } from "./impl/PostgresRepresentationEquilibreeRepo";
import type { IOwnershipRepo } from "./IOwnershipRepo";
import type { IOwnershipRequestRepo } from "./IOwnershipRequestRepo";
import type { IRepresentationEquilibreeRepo } from "./IRepresentationEquilibreeRepo";

let declarationRepo: IDeclarationRepo;
let representationEquilibreeRepo: IRepresentationEquilibreeRepo;
let ownershipRequestRepo: IOwnershipRequestRepo;
let ownershipRepo: IOwnershipRepo;

if (services.db === "postgres") {
  declarationRepo = new PostgresDeclarationRepo();
  representationEquilibreeRepo = new PostgresRepresentationEquilibreeRepo();
  ownershipRequestRepo = new PostgresOwnershipRequestRepo();
  ownershipRepo = new PostgresOwnershipRepo();
}

export { declarationRepo, ownershipRepo, ownershipRequestRepo, representationEquilibreeRepo };
