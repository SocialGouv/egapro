import { DISPLAY_CURRENT_YEAR } from "@common/dict";
import { type ClearObject } from "@common/utils/types";
import { z } from "zod";

import { type NotComputableReason } from "../domain/valueObjects/declaration/indicators/NotComputableReason";
import { orderableColumns as adminDeclarationOrderableColumns } from "./AdminDeclarationDTO";
import { type PublicCompanyDTO } from "./CompanyDTO";
import {
  displayPublicYearCoerciveSchema,
  searchConsultationSchema,
  searchSchema,
  yearCoerciveSchema,
} from "./helpers/common";

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
    year: displayPublicYearCoerciveSchema.default(DISPLAY_CURRENT_YEAR),
  }),
);
export type GetDeclarationStatsInput = ClearObject<z.infer<typeof getDeclarationStatsInputSchema>>;

export interface DeclarationStatsDTO {
  avg: number | null;
  count: number;
  max: number | null;
  min: number | null;
}

export const searchAdminDeclarationInput = z.object({
  ues: z
    .boolean()
    .optional()
    .or(
      z
        .string()
        .transform(val => val === "true")
        .optional(),
    ),
  minDate: z.string().optional(),
  maxDate: z.string().optional(),
  index: z.coerce.number().min(0).max(100).optional(),
  indexComparison: z.enum(["gt", "lt", "eq"]).optional(),
  query: z.string().optional(),
  email: z.string().optional(), // can be a partial email
  year: yearCoerciveSchema.optional(),
  orderBy: z.enum(adminDeclarationOrderableColumns).optional().default("createdAt"),
  orderDirection: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type SearchAdminDeclarationInput = ClearObject<z.input<typeof searchAdminDeclarationInput>>;
export const searchAdminDeclarationDTOSchema = searchAdminDeclarationInput.and(searchSchema);
export type SearchAdminDeclarationDTO = ClearObject<z.infer<typeof searchAdminDeclarationDTOSchema>>;
