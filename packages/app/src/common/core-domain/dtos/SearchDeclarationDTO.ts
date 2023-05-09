import { DISPLAY_CURRENT_YEAR, DISPLAY_PUBLIC_YEARS } from "@common/dict";
import { type ClearObject } from "@common/utils/types";
import { z } from "zod";

import { type NotComputableReason } from "../domain/valueObjects/declaration/indicators/NotComputableReason";
import { type PublicCompanyDTO } from "./DeclarationDTO";
import { searchConsultationSchema } from "./helpers/common";

export interface SearchDeclarationResultDTO {
  company: Record<number, PublicCompanyDTO>;
  name: string;
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
  siren: string;
}

export const searchDeclarationDTOSchema = searchConsultationSchema;
export type SearchDeclarationDTO = ClearObject<z.infer<typeof searchDeclarationDTOSchema>>;

export const getDeclarationStatsInputSchema = searchDeclarationDTOSchema.and(
  z.object({
    year: z.coerce
      .number()
      .refine(
        year => DISPLAY_PUBLIC_YEARS.includes(year),
        `L'année doit être incluse dans la liste ${DISPLAY_PUBLIC_YEARS.join(", ")}`,
      )
      .default(DISPLAY_CURRENT_YEAR),
  }),
);
export type GetDeclarationStatsInput = ClearObject<z.infer<typeof getDeclarationStatsInputSchema>>;

export interface DeclarationStatsDTO {
  avg: number | null;
  count: number;
  max: number | null;
  min: number | null;
}
