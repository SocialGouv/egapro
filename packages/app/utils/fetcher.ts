const API_URL = process.env.NEXT_PUBLIC_API_URL

export const EXPIRED_TOKEN_MESSAGE = "Invalid token : need to login again"

export type FetchError = Error & {
  info?: string
  status?: number
}

export type FetcherReturn = {
  isLoading: boolean
  isError: boolean
  // eslint-disable-next-line no-unused-vars
  mutate: (data: unknown) => void
  error: any
}

export type FetcherReturnImmutable = Omit<FetcherReturn, "mutate">

export type FetcherInfiniteReturn = FetcherReturnImmutable & {
  size: number
  // eslint-disable-next-line no-unused-vars
  setSize: (size: number) => void
}

/* Fetcher which can use an options and handles error in a generic way.
 *
 * @param endpoint the full end point to use
 * @param options the request options (optional)
 * @returns the JSON response
 * @throws an error if the response is not ok
 */
export const genericFetch = async (endpoint: string, options?: any) => {
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
export const fetcher = async (key: string, options: any) => {
  return genericFetch(API_URL + key, options)
}
