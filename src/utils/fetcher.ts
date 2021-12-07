let API_URL = "/api"
if (window.location.href.includes("localhost:")) {
  API_URL = "http://127.0.0.1:2626"
}
if (process.env.REACT_APP_EGAPRO_API_URL) API_URL = process.env.REACT_APP_EGAPRO_API_URL

export const EXPIRED_TOKEN_MESSAGE = "Invalid token : need to login again"

export const fetcher = async (endpoint: string, options: RequestInit) => {
  options = {
    ...options,
    headers: {
      ...options?.headers,
      "API-KEY": localStorage.token,
    },
  }

  const response = await fetch(API_URL + endpoint, options)

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
