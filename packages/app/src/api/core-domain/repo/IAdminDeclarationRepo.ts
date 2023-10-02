import { type AdminDeclarationDTO } from "@common/core-domain/dtos/AdminDeclarationDTO";
import { type SearchAdminDeclarationInput } from "@common/core-domain/dtos/SearchDeclarationDTO";
import { type SearchDefaultCriteria, type SearchDTORepo } from "@common/shared-domain";

export type AdminDeclarationSearchCriteria = SearchAdminDeclarationInput & SearchDefaultCriteria;

export interface IAdminDeclarationRepo extends SearchDTORepo<AdminDeclarationSearchCriteria, AdminDeclarationDTO> {}
