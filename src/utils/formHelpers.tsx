import {
  fractionToPercentage,
  parseDate,
  percentageToFraction,
} from "./helpers";

import { PeriodeDeclaration, TrancheEffectifs } from "../globals";

// INT PARSE

export const parseIntFormValue = (
  value: string,
  defaultValue: any = undefined
) =>
  value === ""
    ? defaultValue
    : Number.isNaN(Number(value))
    ? defaultValue
    : parseInt(value, 10);

export const parseIntStateValue = (value: number | undefined) =>
  value === undefined ? "" : String(value);

// Float PARSE

export const parseFloatFormValue = (
  value: string,
  defaultValue: any = undefined
) =>
  value === ""
    ? defaultValue
    : Number.isNaN(Number(value))
    ? defaultValue
    : percentageToFraction(parseFloat(value));

export const parseFloatStateValue = (value: number | undefined) =>
  value === undefined ? "" : String(fractionToPercentage(value));

// Boolean PARSE

export const parseBooleanFormValue = (value: string) => value === "true";

export const parseBooleanStateValue = (value: boolean) => String(value);

// PeriodeDeclaration PARSE

export const parsePeriodeDeclarationFormValue = (
  value: string
): PeriodeDeclaration => {
  switch (value) {
    case "deuxPeriodesReference":
      return "deuxPeriodesReference" as PeriodeDeclaration;
    case "troisPeriodesReference":
      return "troisPeriodesReference" as PeriodeDeclaration;
    default:
      return "unePeriodeReference" as PeriodeDeclaration;
  }
};

// TrancheEffectif PARSE

export const parseTrancheEffectifsFormValue = (
  value: string
): TrancheEffectifs => {
  switch (value) {
    case "251 à 999":
      return "251 à 999" as TrancheEffectifs;
    case "1000 et plus":
      return "1000 et plus" as TrancheEffectifs;
    default:
      return "50 à 250" as TrancheEffectifs;
  }
};

// VALIDATION

export const required = (value: string): boolean | string =>
  value ? false : "Ce champ ne peut être vide";

export const mustBeNumber = (value: string): boolean =>
  Number.isNaN(Number(value));

export const minNumber = (value: string, min: number): boolean =>
  Number(value) < min;

export const maxNumber = (value: string, max: number): boolean =>
  Number(value) > max;

export const mustBeDate = (value: string): boolean | string => {
  const parsed = parseDate(value);
  return parsed === undefined ||
    parsed.toString() === "ce champ doit contenir une date au format jj/mm/aaaa"
    ? "Ce champ doit contenir une date au format jj/mm/aaaa"
    : false;
};

export const validateDate = (value: string) => {
  const requiredError = required(value);
  const mustBeDateError = mustBeDate(value);
  if (!requiredError && !mustBeDateError) {
    return undefined;
  } else {
    return {
      required: requiredError,
      mustBeDate: mustBeDateError,
    };
  }
};

const regexpEmail = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
export const validateEmail = (email: string) => !regexpEmail.test(email);
