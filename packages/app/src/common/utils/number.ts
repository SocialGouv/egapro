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
 * Truncate a float to only have 1 decimal.
 */
export const truncFloatToOneDecimal = (float: number) => Math.trunc(float * 10) / 10;
