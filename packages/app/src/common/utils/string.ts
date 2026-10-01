declare module "lodash" {
  interface LoDashStatic {
    capitalize<T extends string>(string?: T): Capitalize<T>;
  }
}

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

const PRINTABLE_MAX_LENGTH = 100;

/**
 * A client-supplied value made safe to embed in an error or log message: control characters escaped
 * (a raw newline would forge a log line) and length capped.
 */
export const printable = (value: unknown): string => {
  const escaped = String(value).replace(
    // eslint-disable-next-line no-control-regex
    /[\u0000-\u001f\u007f]/g,
    c => `\\x${c.charCodeAt(0).toString(16).padStart(2, "0")}`,
  );
  return escaped.length > PRINTABLE_MAX_LENGTH ? `${escaped.slice(0, PRINTABLE_MAX_LENGTH)}…` : escaped;
};
