/**
 * Build an URLSearchParams from an object.
 */
export const buildUrlParams = (params: Record<string, number[] | string[] | number | string> = {}): URLSearchParams => {
  const searchParams = new URLSearchParams();

  const entries = Object.entries(params);

  for (const [key, value] of entries) {
    if (Array.isArray(value)) {
      for (const element of value) {
        if (value) searchParams.append(key, String(element));
      }
    } else {
      if (value) searchParams.set(key, String(value));
    }
  }

  return searchParams;
};

export const buildUrlParamsString = (params: Record<string, string[] | string> = {}): string => {
  return buildUrlParams(params).toString();
};

/**
 * Normalize query params to ensure to have only a string, at least an empty one.
 */
export const normalizeQueryParam = (queryparam: string[] | string | undefined) =>
  queryparam === undefined || (Array.isArray(queryparam) && !queryparam.length)
    ? ""
    : Array.isArray(queryparam)
    ? queryparam[0]
    : queryparam;
