let API_URL = "/api"
if (window.location.href.includes("localhost:")) {
  API_URL = "http://127.0.0.1:2626"
}
if (process.env.REACT_APP_EGAPRO_API_URL) API_URL = process.env.REACT_APP_EGAPRO_API_URL

export const EXPIRED_TOKEN_MESSAGE = "Invalid token : need to login again"

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

  if (!response.ok) {
    const error: Error & { info?: string; status?: number } = new Error("Erreur API")

    error.info = (await response.json())?.error
    error.status = response.status

    if (error.info) {
      if (/Invalid token/i.test(error.info) || /No authentication token was provided/i.test(error.info)) {
        error.info = EXPIRED_TOKEN_MESSAGE
      }
    }

    throw error
  }

  if (response.status === 204) {
    return null
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
