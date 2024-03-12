import { type ClearObject } from "@common/utils/types";
import { zodFr } from "@common/utils/zod";
import { type z } from "zod";

import { CSP } from "../domain/valueObjects/CSP";
import { AgeRange } from "../domain/valueObjects/declaration/AgeRange";
import { CompanyWorkforceRange } from "../domain/valueObjects/declaration/CompanyWorkforceRange";
import { RemunerationsMode } from "../domain/valueObjects/declaration/indicators/RemunerationsMode";

const positiveIntOrEmptyString = zodFr
  .literal("", {
    errorMap: () => ({
      message: "Le champ est requis",
    }),
  })
  .or(
    zodFr
      .number()
      .int("La valeur doit être un entier")
      .nonnegative({ message: "Le nombre ne peut pas être inférieur à 0" }),
  );

const remunerationOrEmptyString = zodFr
  .literal("", {
    errorMap: () => ({
      message: "Le champ est requis",
    }),
  })
  .or(
    zodFr
      .number({ invalid_type_error: "Le champ est requis" })
      .positive({ message: "La rémunération ne peut pas être inférieure ou égale à 0" }),
  );

const positiveInt = zodFr
  .number({ invalid_type_error: "Le champ est requis" })
  .int("La valeur doit être un entier")
  .nonnegative({ message: "Le nombre ne peut pas être inférieur à 0" });

const positivePercentageOrEmptyString = zodFr
  .literal("", {
    errorMap: () => ({
      message: "Le champ est requis",
    }),
  })
  .or(
    zodFr
      .number({ invalid_type_error: "Le champ est requis" })
      .nonnegative("Le pourcentage ne peut pas être inférieur à 0")
      .lte(100, "Le pourcentage ne peut pas être supérieur à 100%"),
  );

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
    womenSalary: remunerationOrEmptyString.or(zodFr.undefined()),
    menSalary: remunerationOrEmptyString.or(zodFr.undefined()),
  })
  .superRefine((obj, ctx) => {
    if (obj.womenCount && obj.menCount) {
      if (obj.womenCount >= 3 && obj.menCount >= 3) {
        if (obj.womenSalary === "") {
          ctx.addIssue({
            path: ["womenSalary"],
            code: zodFr.ZodIssueCode.custom,
            message: "Le champ est requis",
          });
        }

        if (obj.menSalary === "") {
          ctx.addIssue({
            path: ["menSalary"],
            code: zodFr.ZodIssueCode.custom,
            message: "Le champ est requis",
          });
        }
      }
    }
  });
const otherAgeRangeNumbers = zodFr.array(
  zodFr.object({
    name: zodFr.string().trim().min(1, "Le champ est requis"),
    category: zodFr.record(zodFr.nativeEnum(AgeRange.Enum), otherAgeRangesSchema),
  }),
);

const indicateur2or3 = zodFr.discriminatedUnion("calculable", [
  zodFr.object({
    calculable: zodFr.literal("oui"),
    pourcentages: zodFr.record(
      zodFr.nativeEnum(CSP.Enum),
      zodFr.object({
        women: positivePercentageOrEmptyString,
        men: positivePercentageOrEmptyString,
      }),
    ),
  }),
  zodFr.object({
    calculable: zodFr.literal("non"),
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
      remunerations: zodFr
        .array(
          zodFr.object({
            name: zodFr.nativeEnum(CSP.Enum),
            category: zodFr
              .record(
                zodFr.nativeEnum(AgeRange.Enum),
                zodFr.object({
                  womenSalary: zodFr
                    .number({
                      invalid_type_error: "Le champs doit être un nombre",
                      required_error: "Le champ est requis",
                    })
                    .positive("La rémunération ne peut pas être inférieure ou égale à 0"),
                  menSalary: zodFr
                    .number({
                      invalid_type_error: "Le champs doit être un nombre",
                      required_error: "Le champ est requis",
                    })
                    .positive("La rémunération ne peut pas être inférieure ou égale à 0"),
                }),
              )
              .optional(),
          }),
        )
        .optional(),
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
          women: positiveInt,
          men: positiveInt,
        })
        .superRefine(({ women, men }, ctx) => {
          if (women === 0 && men === 0)
            ctx.addIssue({
              code: zodFr.ZodIssueCode.custom,
              message: "Tous les champs ne peuvent pas être à 0 s'il y a eu des augmentations",
            });
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
      women: zodFr
        .number({ invalid_type_error: "Le champ est requis" })
        .nonnegative("Le nombre ne peut pas être inférieur à 0")
        .max(10, "Le nombre ne peut pas être supérieur à 10")
        .int("La valeur doit être un entier"),
      men: zodFr
        .number({ invalid_type_error: "Le champ est requis" })
        .nonnegative("Le nombre ne peut pas être inférieur à 0")
        .max(10, "Le nombre ne peut pas être supérieur à 10")
        .int("La valeur doit être un entier"),
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
