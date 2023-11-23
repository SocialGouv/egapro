import { type AdminDeclarationDTO } from "@common/core-domain/dtos/AdminDeclarationDTO";
import { type SearchAdminDeclarationInput } from "@common/core-domain/dtos/SearchDeclarationDTO";
import { type SearchDefaultCriteria, type SearchDTORepo } from "@common/shared-domain";

import { type AdminDeclarationRaw } from "../infra/db/raw";

export type AdminDeclarationSearchCriteria = SearchAdminDeclarationInput & SearchDefaultCriteria;

export interface IAdminDeclarationRepo extends SearchDTORepo<AdminDeclarationSearchCriteria, AdminDeclarationDTO> {}

export const orderByMap = {
  createdAt: "created_at",
  declarantEmail: "declarant_email",
  declarantFirstName: "declarant_firstname",
  declarantLastName: "declarant_lastname",
  index: "index",
  name: "name",
  siren: "siren",
  type: "type",
  year: "year",
} as const satisfies Record<Exclude<AdminDeclarationSearchCriteria["orderBy"], undefined>, keyof AdminDeclarationRaw>;
