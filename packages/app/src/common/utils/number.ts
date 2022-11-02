// Format a float to get rid of .0 if it is an integer value.
export const formatPrettyFloat = (float: number) => (Number.isInteger(float) ? float.toFixed(0) : float.toFixed(1));

// Truncate to only have 1 decimal.
export const truncFloatToOneDecimal = (float: number) => Math.trunc(float * 10) / 10;
