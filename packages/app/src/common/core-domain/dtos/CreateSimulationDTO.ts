import { type ClearObject } from "@common/utils/types";
import { zodFr } from "@common/utils/zod";
import { type z } from "zod";

import { CSP } from "../domain/valueObjects/CSP";
import { AgeRange } from "../domain/valueObjects/declaration/AgeRange";
import { CompanyWorkforceRange } from "../domain/valueObjects/declaration/CompanyWorkforceRange";
import { RemunerationsMode } from "../domain/valueObjects/declaration/indicators/RemunerationsMode";

const positiveIntOrEmptyString = zodFr
  .literal("")
  .or(zodFr.number().int("La valeur doit être un entier").nonnegative());

const singleAgeRangeSchema = zodFr.object({
  women: positiveIntOrEmptyString,
  men: positiveIntOrEmptyString,
});
const ageRangesSchema = zodFr.object({
  [AgeRange.Enum.LESS_THAN_30]: singleAgeRangeSchema,
  [AgeRange.Enum.FROM_30_TO_39]: singleAgeRangeSchema,
  [AgeRange.Enum.FROM_40_TO_49]: singleAgeRangeSchema,
  [AgeRange.Enum.FROM_50_TO_MORE]: singleAgeRangeSchema,
});

const cspAgeRangeNumbers = zodFr.object({
  [CSP.Enum.OUVRIERS]: zodFr.object({
    ageRanges: ageRangesSchema,
  }),
  [CSP.Enum.EMPLOYES]: zodFr.object({
    ageRanges: ageRangesSchema,
  }),
  [CSP.Enum.TECHNICIENS_AGENTS_MAITRISES]: zodFr.object({
    ageRanges: ageRangesSchema,
  }),
  [CSP.Enum.INGENIEURS_CADRES]: zodFr.object({
    ageRanges: ageRangesSchema,
  }),
});

const otherAgeRangesSchema = zodFr
  .object({
    womenCount: positiveIntOrEmptyString,
    menCount: positiveIntOrEmptyString,
    womenSalary: positiveIntOrEmptyString,
    menSalary: positiveIntOrEmptyString,
  })
  .superRefine((obj, ctx) => {
    if (obj.womenCount && obj.menCount) {
      if (obj.womenCount >= 3 && obj.menCount >= 3) {
        if (obj.womenSalary === 0) {
          ctx.addIssue({
            path: ["womenSalary"],
            code: zodFr.ZodIssueCode.too_small,
            minimum: 0,
            inclusive: false,
            type: "number",
          });
        }

        if (obj.menSalary === 0) {
          ctx.addIssue({
            path: ["menSalary"],
            code: zodFr.ZodIssueCode.too_small,
            minimum: 0,
            inclusive: false,
            type: "number",
          });
        }
      }
    }
  });
const otherAgeRangeNumbers = zodFr.array(
  zodFr.object({
    name: zodFr.string().nonempty(),
    categoryId: zodFr.string().nonempty(),
    category: zodFr.record(zodFr.nativeEnum(AgeRange.Enum), otherAgeRangesSchema),
  }),
);

const indicateur2or3 = zodFr.discriminatedUnion("calculable", [
  zodFr.object({
    calculable: zodFr.literal(true),
    pourcentages: zodFr.record(
      zodFr.nativeEnum(CSP.Enum),
      zodFr.object({
        women: zodFr.number().nonnegative().lte(100, "La valeur ne peut pas être supérieure à 100%"),
        men: zodFr.number().nonnegative().lte(100, "La valeur ne peut pas être supérieure à 100%"),
      }),
    ),
  }),
  zodFr.object({
    calculable: zodFr.literal(false),
    pourcentages: zodFr.never().optional(),
  }),
]);

export const createSteps = {
  effectifs: zodFr.object({
    workforceRange: zodFr.nativeEnum(CompanyWorkforceRange.Enum, {
      required_error: "La tranche d'effectif est requise",
      invalid_type_error: "La tranche d'effectif est requise",
    }),
    csp: cspAgeRangeNumbers,
  }),
  indicateur1: zodFr.discriminatedUnion("mode", [
    zodFr.object({
      mode: zodFr.literal(RemunerationsMode.Enum.CSP),
      remunerations: zodFr.array(
        zodFr.object({
          name: zodFr.nativeEnum(CSP.Enum),
          categoryId: zodFr.string().nonempty(),
          category: zodFr
            .record(
              zodFr.nativeEnum(AgeRange.Enum),
              zodFr.object({
                womenSalary: zodFr.number().positive(),
                menSalary: zodFr.number().positive(),
              }),
            )
            .optional(),
        }),
      ),
    }),
    zodFr.object({
      mode: zodFr.literal(RemunerationsMode.Enum.BRANCH_LEVEL),
      remunerations: otherAgeRangeNumbers,
    }),
    zodFr.object({
      mode: zodFr.literal(RemunerationsMode.Enum.OTHER_LEVEL),
      remunerations: otherAgeRangeNumbers,
    }),
  ]),
  indicateur2: indicateur2or3,
  indicateur3: indicateur2or3,
  indicateur2and3: zodFr.discriminatedUnion("calculable", [
    zodFr.object({
      calculable: zodFr.literal("oui"),
      raisedCount: zodFr
        .object({
          women: positiveIntOrEmptyString,
          men: positiveIntOrEmptyString,
        })
        .refine(({ women, men }) => women !== 0 || men !== 0, {
          message: "Tous les champs ne peuvent pas être à 0 s'il y a eu des augmentations.",
        }),
    }),
    zodFr.object({
      calculable: zodFr.literal("non"),
    }),
  ]),
  indicateur4: zodFr.discriminatedUnion("calculable", [
    zodFr.object({
      calculable: zodFr.literal(true),
      count: zodFr
        .object({
          total: positiveIntOrEmptyString,
          raised: positiveIntOrEmptyString,
        })
        .refine(({ total, raised }) => raised <= total, {
          message:
            "Le nombre de salariées augmentées ne peut pas être supérieur au nombre de salariés de retour de congé maternité.",
          path: ["raised"],
        }),
    }),
    zodFr.object({
      calculable: zodFr.literal(false),
      count: zodFr.never().optional(),
    }),
  ]),
  indicateur5: zodFr
    .object({
      women: zodFr.number().nonnegative().max(10),
      men: zodFr.number().nonnegative().max(10),
    })
    .refine(({ women, men }) => women + men <= 10, {
      message:
        "La somme des nombres de salariés parmi les 10 plus hautes rémunérations ne peut pas être supérieure à 10.",
    }),
} as const;

const { effectifs, indicateur2, indicateur2and3, indicateur3, ...otherSteps } = createSteps;
const createSimulationWorkforceRangeLessThan250 = zodFr.object({
  effectifs: effectifs.omit({ workforceRange: true }).extend({
    workforceRange: zodFr.literal(CompanyWorkforceRange.Enum.FROM_50_TO_250),
  }),
  indicateur2and3,
  ...otherSteps,
});

const createSimulationWorkforceRangeMoreThan250 = zodFr.object({
  effectifs: effectifs.omit({ workforceRange: true }).extend({
    workforceRange: zodFr
      .literal(CompanyWorkforceRange.Enum.FROM_251_TO_999)
      .or(zodFr.literal(CompanyWorkforceRange.Enum.FROM_1000_TO_MORE)),
  }),
  indicateur2,
  indicateur3,
  ...otherSteps,
});

export const createSimulationDTO = createSimulationWorkforceRangeLessThan250.or(
  createSimulationWorkforceRangeMoreThan250,
);

export type CreateSimulationWorkforceRangeLessThan250DTO = ClearObject<
  z.infer<typeof createSimulationWorkforceRangeLessThan250>
>;
export type CreateSimulationWorkforceRangeMoreThan250DTO = ClearObject<
  z.infer<typeof createSimulationWorkforceRangeMoreThan250>
>;

export type CreateSimulationDTO =
  | CreateSimulationWorkforceRangeLessThan250DTO
  | CreateSimulationWorkforceRangeMoreThan250DTO;

export const isCreateSimulationWorkforceRangeLessThan250DTO = (
  funnel: CreateSimulationDTO,
): funnel is CreateSimulationWorkforceRangeLessThan250DTO =>
  funnel.effectifs.workforceRange === CompanyWorkforceRange.Enum.FROM_50_TO_250 && "indicateur2and3" in funnel;
