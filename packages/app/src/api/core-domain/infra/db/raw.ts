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
