/**
 * Format a float to get rid of useless decimals.
 *
 * @example
 * ```ts
 * formatPrettyFloat(12.0); // "12"
 * ```
 */
export const formatPrettyFloat = (float: number) => (Number.isInteger(float) ? float.toFixed(0) : float.toFixed(1));

/**
 * Truncate a float to only have 1 decimal by default.
 */
export const truncFloatToDecimal = (float: number, mask = 0.1) => Math.trunc(float * (1 / mask)) / (1 / mask);

/**
 * Format a float to a currency string.
 */
export const currencyFormat = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});

/**
 * Format a float to a percent string with 1 decimal.
 *
 * If the float is on a base "100" it should be divided by 100 before being passed to this function.
 *
 * @example
 * ```ts
 * percentFormat.format(0.5); // "50%"
 * percentFormat.format(0.05); // "5%"
 * percentFormat.format(0.005); // "0,5%"
 * percentFormat.format(0.0005); // "0,1%"
 * percentFormat.format(50); // "5 000%" !
 * ```
 */
export const percentFormat = new Intl.NumberFormat("fr-FR", {
  style: "percent",
  maximumFractionDigits: 1,
});

/**
 * Format a float to a percent string with 3 decimals.
 *
 * If the float is on a base "100" it should be divided by 100 before being passed to this function.
 *
 * @example
 * ```ts
 * precisePercentFormat.format(0.5); // "50%"
 * precisePercentFormat.format(0.05); // "5%"
 * precisePercentFormat.format(0.005); // "0,5%"
 * percentFormat.format(0.0005); // "0,05%"
 * precisePercentFormat.format(50); // "5 000%" !
 * ```
 */
export const precisePercentFormat = new Intl.NumberFormat("fr-FR", {
  style: "percent",
  maximumFractionDigits: 3,
});
