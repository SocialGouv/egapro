import type { ParsedUrlQuery } from "querystring";

/**
 * Build an URLSearchParams from an object.
 *
 * Handle array values.
 */
export const buildUrlParams = (
  params: Record<string, boolean[] | number[] | string[] | boolean | number | string | undefined> = {},
): URLSearchParams => {
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
export const normalizeRouterQuery = (query: ParsedUrlQuery) =>
  Object.fromEntries(
    Object.entries(query).map(([key, value]) => {
      return [
        key,
        value === undefined || (Array.isArray(value) && !value.length) ? "" : Array.isArray(value) ? value[0] : value,
      ];
    }),
  );

export type AnchorLink = `#${string}`;
