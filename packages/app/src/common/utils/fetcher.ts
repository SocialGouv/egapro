import { ApiError } from "next/dist/server/api-utils";
import type { Any } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const EXPIRED_TOKEN_MESSAGE = "Invalid token : need to login again";

export type FetcherReturn = {
  error: unknown;
  isError: boolean;
  isLoading: boolean;

  mutate: (data: Any) => void;
};

export type FetcherReturnImmutable = Omit<FetcherReturn, "mutate">;

export type FetcherInfiniteReturn = FetcherReturnImmutable & {
  setSize: (size: number) => void;
  size: number;
};

/**
 * Fetcher which can use an options and handles error in a generic way.
 *
 * @param endpoint the full end point to use
 * @param options the request options (optional)
 * @returns the JSON response
 * @throws an error if the response is not ok
 */
const genericFetch = async (endpoint: string, options?: RequestInit) => {
  options = {
    ...options,
    headers: {
      ...options?.headers,
      "API-KEY": localStorage.token,
    },
  };

  const response = await fetch(endpoint, options);

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    // const error = new Error("Erreur API") as FetchError;

    let apiMessage = "Erreur API";

    try {
      apiMessage = (await response.json())?.error;
      if (apiMessage) {
        // Use a generic message error for expired token.
        if (/Invalid token/i.test(apiMessage) || /No authentication token was provided/i.test(apiMessage)) {
          apiMessage = EXPIRED_TOKEN_MESSAGE;
        }
      }
    } catch (_ignoreError) {
      // Ignore error, for API which doesn't return JSON.
    }
    throw new ApiError(response.status, apiMessage);
  }

  return response.json();
};

/**
 * Fetcher to call the Egapro API
 *
 * @param key the path to use after the API_URL (named key because it is used in cache for useSWR)
 * @param options the request options (optional)
 */
export const fetcher = async <T>(key: string, options?: RequestInit): Promise<T> => {
  // TODO: better typings relation with genericFetch
  return genericFetch(API_URL + key, options);
};
