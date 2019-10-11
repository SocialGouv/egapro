import { fractionToPercentage, percentageToFraction } from "./helpers";
import { PeriodeDeclaration } from "../globals.d";

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

// VALIDATION

export const required = (value: string): boolean => (value ? false : true);

export const mustBeNumber = (value: string): boolean =>
  Number.isNaN(Number(value)) ? true : false;

export const minNumber = (value: string, min: number): boolean =>
  Number(value) < min ? true : false;

export const maxNumber = (value: string, max: number): boolean =>
  Number(value) > max ? true : false;

const regexpEmail = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
export const validateEmail = (email: string) => !regexpEmail.test(email);
