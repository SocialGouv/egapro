import type { ErrorDetailTuple } from "@common/core-domain/domain/ErrorDetailTuple";
import type { DeclarationDTO as DeclarationDataRaw } from "@common/models/generated";

export interface DeclarationRaw {
  data?: DeclarationDataRaw;
  declarant: string;
  declared_at: string;
  draft?: DeclarationDataRaw;
  ft: string;
  legacy?: DeclarationDataRaw;
  modified_at: string;
  siren: string;
  year: number;
}

export interface RepresentationEquilibreeRaw {
  data?: DeclarationDataRaw;
  declared_at: string;
  ft: string;
  modified_at: string;
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
