/**
 * Normalize query params to ensure to have only a string, at least an empty one.
 */
export const normalizeQueryParam = (queryparam: string[] | string | undefined) =>
  queryparam === undefined ? "" : Array.isArray(queryparam) ? (queryparam.length ? queryparam[0] : "") : queryparam;
