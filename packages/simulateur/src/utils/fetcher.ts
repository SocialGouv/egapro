let API_URL = "/api"
if (window.location.href.includes("localhost:")) {
  API_URL = "http://127.0.0.1:2626"
}
if (process.env.REACT_APP_EGAPRO_API_URL) API_URL = process.env.REACT_APP_EGAPRO_API_URL
let APIV2_URL = "/apiv2"
if (window.location.href.includes("localhost:")) {
  APIV2_URL = "http://127.0.0.1:3000/apiv2"
}
if (process.env.REACT_APP_EGAPRO_APIV2_URL) APIV2_URL = process.env.REACT_APP_EGAPRO_APIV2_URL

export const EXPIRED_TOKEN_MESSAGE = "Invalid token : need to login again"

export type FetchError = Error & {
  info?: string
  status?: number
}

/* Fetcher which can use an options and handles error in a generic way.
 *
 * @param endpoint the full end point to use
 * @param options the request options (optional)
 * @returns the JSON response
 * @throws an error if the response is not ok
 */
export const genericFetch = async (endpoint: string, options?: RequestInit) => {
  options = {
    ...options,
    headers: {
      ...options?.headers,
      "API-KEY": localStorage.token,
    },
  }

  const response = await fetch(endpoint, options)

  if (response.status === 204) {
    return null
  }

  if (!response.ok) {
    const error = new Error("Erreur API") as FetchError
    error.status = response.status

    try {
      let info = (await response.json())?.error
      if (info) {
        // Use a generic message error for expired token.
        if (/Invalid token/i.test(info) || /No authentication token was provided/i.test(info)) {
          info = EXPIRED_TOKEN_MESSAGE
        }
      }
      error.info = info
    } catch (_ignoreError) {
      // Ignore error, for API which doesn't return JSON.
    }

    throw error
  }

  return response.json()
}

/**
 * Fetcher to call the Egapro API
 *
 * @param key the path to use after the API_URL (named key because it is used in cache for useSWR)
 * @param options the request options (optional)
 */
export const fetcher = async (key: string, options: RequestInit) => {
  return genericFetch(API_URL + key, options)
}

export const fetcherV2 = async (key: string, options: RequestInit) => {
  return genericFetch(APIV2_URL + key, options)
}
