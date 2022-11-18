export const capitalize = <T extends string>(string: T) => {
  return (
    string && string.length ? string.charAt(0).toUpperCase() + string.slice(1).toLowerCase() : ""
  ) as Capitalize<T>;
};

/**
 * Tests a value against "yes", 1, "1", "true" ignoring case.
 */
export const isTruthy = (v?: string): boolean => !!v && ["yes", "true", "1"].includes(v.toLowerCase());

/**
 * Tests a value against "no", 0, "0", "false" ignoring case.
 */
export const isFalsy = (v?: string): boolean => !v || ["no", "false", "0"].includes(v.toLowerCase());

/**
 * Escape characters with special meaning either inside or outside character sets.
 *
 * Use a simple backslash escape when it’s always valid, and a `\xnn` escape when the simpler form would be disallowed by Unicode patterns’ stricter grammar.
 */
export const escapeStringRegexp = (string: string) =>
  string.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
