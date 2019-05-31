import { fractionToPercentage, percentageToFraction } from "./helpers";

// INT

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

// Float

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
