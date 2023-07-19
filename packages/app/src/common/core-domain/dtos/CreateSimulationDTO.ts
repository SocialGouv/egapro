import { type ClearObject } from "@common/utils/types";
import { z } from "zod";

import { CSP } from "../domain/valueObjects/CSP";
import { CompanyWorkforceRange } from "../domain/valueObjects/declaration/CompanyWorkforceRange";
import { RemunerationsMode } from "../domain/valueObjects/declaration/indicators/RemunerationsMode";
import { CSPAgeRange } from "../domain/valueObjects/declaration/simulation/CSPAgeRange";

const nonnegativeNanSafe = z
  .number()
  .nonnegative()
  .default(0)
  .transform(v => (isNaN(v) ? 0 : v));

const singleAgeRangeSchema = z.object({
  women: nonnegativeNanSafe,
  men: nonnegativeNanSafe,
});
const ageRangesSchema = z.object({
  [CSPAgeRange.Enum.LESS_THAN_30]: singleAgeRangeSchema,
  [CSPAgeRange.Enum.FROM_30_TO_39]: singleAgeRangeSchema,
  [CSPAgeRange.Enum.FROM_40_TO_49]: singleAgeRangeSchema,
  [CSPAgeRange.Enum.FROM_50_TO_MORE]: singleAgeRangeSchema,
});

const cspAgeRangeNumbers = z.object({
  [CSP.Enum.OUVRIERS]: z.object({
    ageRanges: ageRangesSchema,
  }),
  [CSP.Enum.EMPLOYES]: z.object({
    ageRanges: ageRangesSchema,
  }),
  [CSP.Enum.TECHNICIENS_AGENTS_MAITRISES]: z.object({
    ageRanges: ageRangesSchema,
  }),
  [CSP.Enum.INGENIEURS_CADRES]: z.object({
    ageRanges: ageRangesSchema,
  }),
});

const otherAgeRangesSchema = z
  .object({
    womenCount: nonnegativeNanSafe,
    menCount: nonnegativeNanSafe,
    womenSalary: nonnegativeNanSafe,
    menSalary: nonnegativeNanSafe,
  })
  .superRefine((obj, ctx) => {
    if (obj.womenCount >= 3 && obj.menCount >= 3) {
      if (obj.womenSalary === 0) {
        ctx.addIssue({
          path: ["womenSalary"],
          code: z.ZodIssueCode.too_small,
          minimum: 0,
          inclusive: false,
          type: "number",
        });
      }

      if (obj.menSalary === 0) {
        ctx.addIssue({
          path: ["menSalary"],
          code: z.ZodIssueCode.too_small,
          minimum: 0,
          inclusive: false,
          type: "number",
        });
      }
    }
  });
const otherAgeRangeNumbers = z.array(
  z.object({
    name: z.string().nonempty(),
    id: z.string().nonempty(),
    category: z.record(z.nativeEnum(CSPAgeRange.Enum), otherAgeRangesSchema),
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
      remunerations: z.array(
        z.object({
          name: z.nativeEnum(CSP.Enum),
          id: z.string().nonempty(),
          category: z
            .record(
              z.nativeEnum(CSPAgeRange.Enum),
              z.object({
                womenSalary: z.number().positive(),
                menSalary: z.number().positive(),
              }),
            )
            .optional(),
        }),
      ),
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
