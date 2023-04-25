import { services } from "@common/config";

import type { IDeclarationRepo } from "./IDeclarationRepo";
import { PostgresDeclarationRepo } from "./impl/PostgresDeclarationRepo";
import { PostgresOwnershipRepo } from "./impl/PostgresOwnershipRepo";
import { PostgresOwnershipRequestRepo } from "./impl/PostgresOwnershipRequestRepo";
import { PostgresReferentRepo } from "./impl/PostgresReferentRepo";
import { PostgresRepresentationEquilibreeRepo } from "./impl/PostgresRepresentationEquilibreeRepo";
import { PostgresRepresentationEquilibreeSearchRepo } from "./impl/PostgresRepresentationEquilibreeSearchRepo";
import type { IOwnershipRepo } from "./IOwnershipRepo";
import type { IOwnershipRequestRepo } from "./IOwnershipRequestRepo";
import type { IReferentRepo } from "./IReferentRepo";
import type { IRepresentationEquilibreeRepo } from "./IRepresentationEquilibreeRepo";
import type { IRepresentationEquilibreeSearchRepo } from "./IRepresentationEquilibreeSearchRepo";

export let declarationRepo: IDeclarationRepo;
export let representationEquilibreeRepo: IRepresentationEquilibreeRepo;
export let ownershipRequestRepo: IOwnershipRequestRepo;
export let ownershipRepo: IOwnershipRepo;
export let referentRepo: IReferentRepo;
export let representationEquilibreeSearchRepo: IRepresentationEquilibreeSearchRepo;

if (services.db === "postgres") {
  declarationRepo = new PostgresDeclarationRepo();
  representationEquilibreeRepo = new PostgresRepresentationEquilibreeRepo();
  ownershipRequestRepo = new PostgresOwnershipRequestRepo();
  ownershipRepo = new PostgresOwnershipRepo();
  referentRepo = new PostgresReferentRepo();
  representationEquilibreeSearchRepo = new PostgresRepresentationEquilibreeSearchRepo();
}
