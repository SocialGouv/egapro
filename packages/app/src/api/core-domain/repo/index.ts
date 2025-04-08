import { services } from "@common/config";

import { type IAdminDeclarationRepo } from "./IAdminDeclarationRepo";
import { type IAuditRepo } from "./IAuditRepo";
import { type IDeclarationRepo } from "./IDeclarationRepo";
import { type IDeclarationSearchRepo } from "./IDeclarationSearchRepo";
import { PostgresAdminDeclarationRepo } from "./impl/PostgresAdminDeclarationRepo";
import { PostgresAuditRepo } from "./impl/PostgresAuditRepo";
import { PostgresDeclarationRepo } from "./impl/PostgresDeclarationRepo";
import { PostgresDeclarationSearchRepo } from "./impl/PostgresDeclarationSearchRepo";
import { PostgresOwnershipRepo } from "./impl/PostgresOwnershipRepo";
import { PostgresOwnershipRequestRepo } from "./impl/PostgresOwnershipRequestRepo";
import { PostgresPublicStatsRepo } from "./impl/PostgresPublicStatsRepo";
import { PostgresReferentRepo } from "./impl/PostgresReferentRepo";
import { PostgresRepresentationEquilibreeRepo } from "./impl/PostgresRepresentationEquilibreeRepo";
import { PostgresRepresentationEquilibreeSearchRepo } from "./impl/PostgresRepresentationEquilibreeSearchRepo";
import { type IOwnershipRepo } from "./IOwnershipRepo";
import { type IOwnershipRequestRepo } from "./IOwnershipRequestRepo";
import { type IPublicStatsRepo } from "./IPublicStatsRepo";
import { type IReferentRepo } from "./IReferentRepo";
import { type IRepresentationEquilibreeRepo } from "./IRepresentationEquilibreeRepo";
import { type IRepresentationEquilibreeSearchRepo } from "./IRepresentationEquilibreeSearchRepo";

export let declarationRepo: IDeclarationRepo;
export let representationEquilibreeRepo: IRepresentationEquilibreeRepo;
export let ownershipRequestRepo: IOwnershipRequestRepo;
export let ownershipRepo: IOwnershipRepo;
export let referentRepo: IReferentRepo;
export let representationEquilibreeSearchRepo: IRepresentationEquilibreeSearchRepo;
export let declarationSearchRepo: IDeclarationSearchRepo;
export let publicStatsRepo: IPublicStatsRepo;
export let adminDeclarationRepo: IAdminDeclarationRepo;
export let auditRepo: IAuditRepo;

if (services.db === "postgres") {
  declarationRepo = new PostgresDeclarationRepo();
  representationEquilibreeRepo = new PostgresRepresentationEquilibreeRepo();
  ownershipRequestRepo = new PostgresOwnershipRequestRepo();
  ownershipRepo = new PostgresOwnershipRepo();
  referentRepo = new PostgresReferentRepo();
  representationEquilibreeSearchRepo = new PostgresRepresentationEquilibreeSearchRepo();
  declarationSearchRepo = new PostgresDeclarationSearchRepo();
  publicStatsRepo = new PostgresPublicStatsRepo();
  adminDeclarationRepo = new PostgresAdminDeclarationRepo();
  auditRepo = new PostgresAuditRepo();
}
