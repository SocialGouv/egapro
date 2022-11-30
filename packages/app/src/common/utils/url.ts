/**
 * Build an URLSearchParams from an object.
 */
export const buildUrlParams = (params: Record<string, string[] | string> = {}): URLSearchParams => {
  const searchParams = new URLSearchParams();

  const entries = Object.entries(params);

  for (const [key, value] of entries) {
    if (Array.isArray(value)) {
      for (const element of value) {
        if (value) searchParams.append(key, element);
      }
    } else {
      if (value) searchParams.set(key, value);
    }
  }

  return searchParams;
};

export const buildUrlParamsString = (params: Record<string, string[] | string> = {}): string => {
  return buildUrlParams(params).toString();
};