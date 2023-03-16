import { config } from "@common/config";
import { ApiError } from "next/dist/server/api-utils";

import type { Any } from "../../common/utils/types";
import { useUserStore } from "./useUser";

export const EXPIRED_TOKEN_MESSAGE = "Invalid token : need to login again";

export type FetcherReturn = {
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  message?: AlertMessageType | null;
  mutate: (data: Any) => void;
};

export type FetcherReturnImmutable = Omit<FetcherReturn, "mutate">;

export type FetcherInfiniteReturn = FetcherReturn & {
  setSize: (size: number) => void;
  size: number;
};

export type FetchError = Error & {
  info?: string;
  status?: number;
};

export type AlertMessageType = {
  kind: "error" | "success";
  text: string;
};

export type FetcherOptions = RequestInit & { throwErrorOn404?: boolean };

/**
 * Fetcher which can use an options and handles error in a generic way.
 *
 * @param endpoint the full end point to use
 * @param options the request options (optional) + throwErrorOn404 to consider 404 as an error or not
 * @returns the JSON response
 * @throws an error if the response is not ok
 */
const genericFetch = async (endpoint: string, options: FetcherOptions = { throwErrorOn404: true }) => {
  options = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
      "API-KEY": useUserStore.getState().token,
    },
  };

  const response = await fetch(endpoint, options);

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    if (response.status === 404 && !options.throwErrorOn404) return null;

    let apiMessage = "Erreur API";

    try {
      apiMessage = (await response.json())?.error;
      if (apiMessage) {
        // Use a generic message error for expired token.
        if (/Invalid token/i.test(apiMessage) || /No authentication token was provided/i.test(apiMessage)) {
          apiMessage = EXPIRED_TOKEN_MESSAGE;
        }
      }
    } catch {
      // Ignore error, for API which doesn't return JSON.
    }
    throw new ApiError(response.status, apiMessage);
  }

  return response.json();
};

/**
 * Fetcher to call the Egapro API.
 *
 * @param key the path to use after the API URL (named key because it is used in cache for useSWR)
 * @param options the request options (optional)
 */
export const fetcher = <T>(key: string, options?: FetcherOptions): Promise<T> => {
  // TODO: better typings relation with genericFetch
  return genericFetch(config.api_url + key, options);
};

/**
 * Fetcher to call the Egapro API v2.
 *
 * @param key the path to use after the API URL (named key because it is used in cache for useSWR)
 * @param options the request options (optional)
 */
export const fetcherV2 = <T>(key: string, options?: FetcherOptions): Promise<T> => {
  return genericFetch(config.apiv2_url + key, options);
};

function makeMessage(kind: AlertMessageType["kind"]) {
  return function (text: string): AlertMessageType {
    return { kind, text };
  };
}

/**
 * Build a success message to display in a Toast
 *
 * @param text Text to display in the alert
 * @returns AlertMessageType
 */
export function sucessMessage(text: string): AlertMessageType {
  return makeMessage("success")(text);
}

/**
 * Build an error message to display in a Toast
 *
 * @param text Text to display in the alert
 * @returns AlertMessageType
 */
export function errorMessage(text: string): AlertMessageType {
  return makeMessage("error")(text);
}

// Helper to have generic messages for app.
export function genericErrorMessage(error: FetchError): AlertMessageType | null {
  if (!error) return null;

  switch (error?.status) {
    case 404: {
      return errorMessage("Aucun résultat trouvé.");
    }
    case 500: {
      return errorMessage("Une erreur est survenue lors de la récupération des données.");
    }
    case 403: {
      if (error?.info === EXPIRED_TOKEN_MESSAGE) {
        return errorMessage("Votre session a expiré, veuillez vous reconnecter.");
      }
      return errorMessage("Problème de droits d'accès.");
    }
    default: {
      return errorMessage("Une erreur imprévue est survenue lors de la récupération des données.");
    }
  }
}
