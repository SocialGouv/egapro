export const normalizeQueryParam = (queryparam: string[] | string | undefined) =>
  queryparam === undefined ? "" : Array.isArray(queryparam) ? (queryparam.length ? queryparam[0] : "") : queryparam;
