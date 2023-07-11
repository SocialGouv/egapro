import { FrenchPhoneNumber } from "@common/core-domain/domain/valueObjects/FrenchPhoneNumber";
import { Email } from "@common/shared-domain/domain/valueObjects";
import { isValid, parseISO } from "date-fns";
import { z } from "zod";

import { zodValueObjectSuperRefine } from "./zod";

export const zodSirenSchema = z
  .string()
  .min(1, { message: "Le Siren est requis." })
  .regex(/^[0-9]{9}$/, "Le Siren est formé de 9 chiffres.");

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

/**
 * Représentation d'un nombre en string.
 */
export const zodPositiveIntegerSchema = z.string().refine(val => Number.isInteger(Number(val)) && Number(val) > 0, {
  message: "Un nombre positif est attendu.",
});

export const zodRealPositiveIntegerSchema = z
  .number({ invalid_type_error: "Le champ est requis", required_error: "Le champ est requis" })
  .int({ message: "La valeur doit être un entier" })
  .positive({ message: "La valeur doit être positive" });

export const zodRealIntegerSchema = z
  .number({ invalid_type_error: "Le champ est requis", required_error: "Le champ est requis" })
  .int({ message: "La valeur doit être un entier" });

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

const INVALID_PERCENTAGE = "Le champ est requis";

export const zodRealPercentageSchema = z
  .number()
  .refine(percentage => percentage >= 0, {
    message: "Le pourcentage doit être positif",
  })
  .refine(percentage => percentage <= 100, { message: "Le pourcentage maximum est 100" });

export const zodPercentageSchema = z
  .string()
  .transform((val, ctx) => {
    const percentage = parseFloat(val);

    if (isNaN(percentage)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: INVALID_PERCENTAGE,
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
  .superRefine(zodValueObjectSuperRefine(FrenchPhoneNumber, "Le numéro de téléphone est invalide"));

export type RadioInputValueType = z.infer<typeof zodRadioInputSchema>;

export const radioStringToBool = (radioInput: RadioInputValueType): boolean => radioInput === "oui";

export const radioBoolToString = (value: boolean | undefined): RadioInputValueType | "" =>
  value === true ? "oui" : value === false ? "non" : "";
