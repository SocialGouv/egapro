import { fractionToPercentage, percentageToFraction } from "./helpers";

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
