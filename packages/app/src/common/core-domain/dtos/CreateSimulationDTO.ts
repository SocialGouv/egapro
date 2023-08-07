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
    categoryId: z.string().nonempty(),
    category: z.record(z.nativeEnum(CSPAgeRange.Enum), otherAgeRangesSchema),
  }),
);

const indicateur2or3 = z.discriminatedUnion("calculable", [
  z.object({
    calculable: z.literal(true),
    pourcentages: z
      .record(
        z.nativeEnum(CSP.Enum),
        z.object({
          women: z.number().positive().max(100),
          men: z.number().positive().max(100),
        }),
      )
      .default({}),
  }),
  z.object({
    calculable: z.literal(false),
    pourcentages: z.never().optional(),
  }),
]);

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
      remunerations: z
        .array(
          z.object({
            name: z.nativeEnum(CSP.Enum),
            categoryId: z.string().nonempty(),
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
        )
        .default([]),
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
  indicateur2: indicateur2or3,
  indicateur3: indicateur2or3,
  indicateur2and3: z.discriminatedUnion("calculable", [
    z.object({
      calculable: z.literal(true),
      raises: z
        .object({
          women: z.number().nonnegative(),
          men: z.number().nonnegative(),
        })
        .refine(({ women, men }) => !(!women && !men), {
          message: "Tous les champs ne peuvent pas être à 0 s'il y a eu des augmentations.",
        }),
    }),
    z.object({
      calculable: z.literal(false),
      raises: z.never().optional(),
    }),
  ]),
} as const;

const { effectifs, indicateur2, indicateur2and3, indicateur3, ...otherSteps } = createSteps;
const createSimulationWorkforceRangeLessThan250 = z.object({
  effectifs: effectifs.omit({ workforceRange: true }).extend({
    workforceRange: z.literal(CompanyWorkforceRange.Enum.FROM_50_TO_250),
  }),
  indicateur2and3,
  ...otherSteps,
});

const createSimulationWorkforceRangeMoreThan250 = z.object({
  effectifs: effectifs.omit({ workforceRange: true }).extend({
    workforceRange: z
      .literal(CompanyWorkforceRange.Enum.FROM_251_TO_999)
      .or(z.literal(CompanyWorkforceRange.Enum.FROM_1000_TO_MORE)),
  }),
  indicateur2,
  indicateur3,
  ...otherSteps,
});

export const createSimulationDTO = createSimulationWorkforceRangeLessThan250.or(
  createSimulationWorkforceRangeMoreThan250,
);

export type CreateSimulationDTO = ClearObject<z.infer<typeof createSimulationDTO>>;
