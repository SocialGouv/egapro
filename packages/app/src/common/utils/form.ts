import { FrenchPhoneNumber } from "@common/core-domain/domain/valueObjects/FrenchPhoneNumber";
import { Email } from "@common/shared-domain/domain/valueObjects";
import { isValid, parseISO } from "date-fns";
import { z } from "zod";

import { INVALID_SIREN, MANDATORY_SIREN } from "../../app/(default)/messages";
import { zodValueObjectSuperRefine } from "./zod";

export const zodSirenSchema = z
  .string()
  .min(1, { message: MANDATORY_SIREN })
  .regex(/^[0-9]{9}$/, INVALID_SIREN);

// TODO: make 2020 a constant or better, fetch the authorized years in /config endpoint (see useConfig).
export const zodYearSchema = z
  .string()
  .min(1, "L'année est requise.")
  .refine(year => !isNaN(parseInt(year, 10)) && parseInt(year, 10) > 2020, {
    message: "L'année doit être un nombre supérieur à 2020",
  });

/**
 * Représentation d'une date en string.
 */
export const zodDateSchema = z.string().refine(val => isValid(parseISO(val)), {
  message: "La date n'est pas valide.",
});

export const zodPositiveIntegerSchema = z
  .number({ invalid_type_error: "Le champ est requis", required_error: "Le champ est requis" })
  .int({ message: "La valeur doit être un entier" })
  .positive({ message: "La valeur doit être positive" });

export const zodPositiveOrZeroIntegerSchema = z
  .number({ invalid_type_error: "Le champ est requis", required_error: "Le champ est requis" })
  .int({ message: "La valeur doit être un entier" })
  .nonnegative({ message: "La valeur doit être positive" });

export const zodPositiveOrZeroNumberSchema = z
  .number({ invalid_type_error: "Le champ est requis", required_error: "Le champ est requis" })
  .nonnegative({ message: "La valeur doit être positive ou égale à 0" });

export const zodRadioInputSchema = z.string().transform((val, ctx) => {
  if (val !== "oui" && val !== "non") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Le champ est requis",
    });
    return z.NEVER;
  }
  return val;
});

export const zodPercentageSchema = zodPositiveOrZeroNumberSchema.refine(percentage => percentage <= 100, {
  message: "La valeur maximale est 100",
});

export const zodNumberOrEmptyString = z
  .literal("", {
    errorMap: () => ({
      message: "La valeur est obligatoire",
    }),
  })
  .or(z.number({ invalid_type_error: "La valeur doit être un nombre" }));

export const zodNumberOrNull = z.null().or(z.number({ invalid_type_error: "La valeur doit être un nombre" }));

export const zodPercentOrNaNOrNull = z
  .null()
  .or(
    z
      .nan()
      .or(
        z
          .number({ invalid_type_error: "La valeur doit être un nombre" })
          .nonnegative()
          .max(100, "La valeur ne peut pas être supérieure à 100%"),
      ),
  );

/** @deprecated */
export const zodPercentageAsStringSchema = z
  .string()
  .transform((val, ctx) => {
    const percentage = parseFloat(val);

    if (isNaN(percentage)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le champ est requis",
      });
      return z.NEVER;
    }

    if (percentage < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le pourcentage doit être positif",
      });
      return z.NEVER;
    }

    if (percentage > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le pourcentage maximum est 100",
      });
      return z.NEVER;
    }

    const parts = val.split(".");

    if (parts.length > 1 && parts[1].length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le pourcentage n'a au maximum qu'un chiffre après la virgule",
      });
      return z.NEVER;
    }

    return percentage;
  })
  .optional();

export const zodEmail = z.string().superRefine(zodValueObjectSuperRefine(Email));

export const zodPhone = z
  .string()
  .nonempty("Le numéro de téléphone est requis")
  .superRefine(zodValueObjectSuperRefine(FrenchPhoneNumber, "Le numéro de téléphone est invalide"));

export type RadioInputValueType = z.infer<typeof zodRadioInputSchema>;

export const radioStringToBool = (radioInput: RadioInputValueType): boolean => radioInput === "oui";

export const radioBoolToString = (value: boolean | undefined): RadioInputValueType | "" =>
  value === true ? "oui" : value === false ? "non" : "";

/**
 * Utility function to convert a string to a float or an empty string if the string is not a number.
 * The valueAsNumber is dangerous because it returns null when the input is empty.
 * This is not recommended by React docs to use null or undefined as it will induce it to be an uncontrolled input.
 */
export const setValueAsFloatOrEmptyString = (value: string) => (isNaN(parseFloat(value)) ? "" : parseFloat(value));
