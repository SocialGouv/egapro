import { type z } from "zod";

import { type NotComputableReason } from "../domain/valueObjects/declaration/indicators/NotComputableReason";
import { type PublicCompanyDTO } from "./DeclarationDTO";
import { consultationSchema } from "./helpers/common";

export interface SearchDeclarationResultDTO {
  company: Record<number, PublicCompanyDTO>;
  results: Record<
    number,
    {
      highRemunerationsScore: number | null;
      index: number | null;
      maternityLeavesScore: number | null;
      notComputableReasonMaternityLeaves: NotComputableReason.Enum | null;
      notComputableReasonPromotions: NotComputableReason.Enum | null;
      notComputableReasonRemunerations: NotComputableReason.Enum | null;
      notComputableReasonSalaryRaises: NotComputableReason.Enum | null;
      notComputableReasonSalaryRaisesAndPromotions: NotComputableReason.Enum | null;
      promotionsScore: number | null;
      remunerationsScore: number | null;
      salaryRaisesAndPromotionsScore: number | null;
      salaryRaisesScore: number | null;
    }
  >;
}

export const searchDeclarationInputDTOSchema = consultationSchema;
export type SearchDeclarationInputDTO = z.infer<typeof searchDeclarationInputDTOSchema>;
export type SearchDeclarationInputSchemaDTO = z.input<typeof searchDeclarationInputDTOSchema>;

export interface DeclarationStatsDTO {
  avg: number;
  count: number;
  max: number;
  min: number;
}
