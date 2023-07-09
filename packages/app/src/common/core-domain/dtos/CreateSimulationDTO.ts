import { type ClearObject } from "@common/utils/types";
import { z } from "zod";

import { CSP } from "../domain/valueObjects/CSP";
import { CompanyWorkforceRange } from "../domain/valueObjects/declaration/CompanyWorkforceRange";
import { RemunerationsMode } from "../domain/valueObjects/declaration/indicators/RemunerationsMode";
import { CSPAgeRange } from "../domain/valueObjects/declaration/simulation/CSPAgeRange";

export const categories = [
  CSP.Enum.OUVRIERS,
  CSP.Enum.EMPLOYES,
  CSP.Enum.TECHNICIENS_AGENTS_MAITRISES,
  CSP.Enum.INGENIEURS_CADRES,
] as const;
export const ageRanges = [
  CSPAgeRange.Enum.LESS_THAN_30,
  CSPAgeRange.Enum.FROM_30_TO_39,
  CSPAgeRange.Enum.FROM_40_TO_49,
  CSPAgeRange.Enum.FROM_50_TO_MORE,
] as const;

const nonnegativeNanSafe = z
  .number()
  .nonnegative()
  .default(0)
  .transform(v => (isNaN(v) ? 0 : v));

const cspAgeRangeNumbers = z.array(
  z.object({
    name: z.nativeEnum(CSP.Enum),
    ageRange: z.record(
      z.nativeEnum(CSPAgeRange.Enum),
      z.object({ women: nonnegativeNanSafe, men: nonnegativeNanSafe }),
    ),
  }),
);

const otherAgeRangeNumbers = z.array(
  z.object({
    name: z.string(),
    ageRange: z.record(
      z.nativeEnum(CSPAgeRange.Enum),
      z
        .object({
          womenCount: nonnegativeNanSafe,
          menCount: nonnegativeNanSafe,
          womenSalary: nonnegativeNanSafe,
          menSalary: nonnegativeNanSafe,
        })
        .superRefine((obj, ctx) => {
          if (obj.womenCount >= 3 || obj.menCount >= 3) {
            if (obj.womenSalary === 0) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["womenSalary"],
              });
            }

            if (obj.menSalary === 0) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: ["menSalary"],
              });
            }
          }
        }),
    ),
  }),
);

export const createSteps = {
  effectifs: z.object({
    workforceRange: z.nativeEnum(CompanyWorkforceRange.Enum, {
      required_error: "La tranche d'effectif est requise",
      invalid_type_error: "La tranche d'effectif est requise",
    }),
    csp: cspAgeRangeNumbers,
  }),
  indicateur1: z.discriminatedUnion("mode", [
    z.object({
      mode: z.literal(RemunerationsMode.Enum.CSP),
      remunerations: cspAgeRangeNumbers,
    }),
    z.object({
      mode: z.literal(RemunerationsMode.Enum.BRANCH_LEVEL),
      remunerations: otherAgeRangeNumbers,
    }),
    z.object({
      mode: z.literal(RemunerationsMode.Enum.OTHER_LEVEL),
      remunerations: otherAgeRangeNumbers,
    }),
  ]),
} as const;

export const createSimulationDTO = z.object(createSteps);
// .and(createSteps.periodeReference)
// .and(createSteps.ecartsCadres)
// .and(createSteps.ecartsMembres)
// .and(
//   z
//     .object({
//       publishDate: z.never().optional(),
//     })
//     .or(createSteps.publication),
// );

export type CreateSimulationDTO = ClearObject<z.infer<typeof createSimulationDTO>>;
