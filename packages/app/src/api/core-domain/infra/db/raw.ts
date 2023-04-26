import { type ErrorDetailTuple } from "@common/core-domain/domain/valueObjects/ownership_request/ErrorDetail";
import { type DeclarationDTO as DeclarationDataRaw } from "@common/models/generated";

export interface DeclarationRaw {
  data: DeclarationDataRaw | null;
  declarant: string;
  declared_at: Date;
  draft: DeclarationDataRaw | null;
  ft: string;
  legacy: DeclarationDataRaw | null;
  modified_at: Date;
  siren: string;
  year: number;
}

export interface RepresentationEquilibreeRaw {
  data?: DeclarationDataRaw;
  declared_at: Date;
  ft: string;
  modified_at: Date;
  siren: string;
  year: number;
}

export interface OwnershipRequestRaw {
  asker_email: string;
  created_at: string;
  email: string | null;
  error_detail: ErrorDetailTuple | null;
  id: string;
  modified_at: string;
  siren: string | null;
  status: string;
}

export interface OwnershipRaw {
  email: string;
  siren: string;
}

export interface ReferentRaw {
  county: string | null;
  id: string;
  name: string;
  principal: boolean;
  region: string;
  substitute_email: string | null;
  substitute_name: string | null;
  type: string;
  value: string;
}
