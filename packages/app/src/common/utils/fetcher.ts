export const EXPIRED_TOKEN_MESSAGE = "Invalid token : need to login again"

export type FetchError = Error & {
  info?: string
  status?: number
}

const commonHeaders = {
  Accept: "application/json",
}

const commonContentHeaders = {
  ...commonHeaders,
  "Content-Type": "application/json",
}

class ApiError extends Error {
  response: Response
  jsonBody: Record<string, any>
  constructor(response: Response, jsonBody: Record<string, any>, ...params: any) {
    super(...params)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError)
    }
    this.response = response
    this.jsonBody = jsonBody
    this.name = "ApiError"
  }
}

// TODO: refactor this.
async function checkStatusAndParseJson(response: Response): Promise<any> {
  if (response.status === 204) {
    return { response }
  }

  const jsonPromise = response.json() // there's always a body
  if (response.status >= 200 && response.status < 300) {
    return jsonPromise.then((jsonBody) => ({ response, jsonBody }))
  } else {
    return jsonPromise.then((jsonBody) => {
      const apiError = new ApiError(response, jsonBody, "Erreur dans l'API")
      return Promise.reject.bind(Promise)(apiError)
    })
  }
}

/**
 * Get origin of the API.
 */
function getOrigin() {
  let origin = "/api"
  if (window.location.href.includes("localhost:")) {
    origin = "http://127.0.0.1:2626"
  }

  if (process.env.NEXT_PUBLIC_API_URL) origin = process.env.NEXT_PUBLIC_API_URL

  return origin
}

async function fetchResource(method: string, pathname: string, body?: Record<string, any>) {
  const headers = body ? commonContentHeaders : commonHeaders

  const requestObj = {
    method,
    headers: {
      ...headers,
      "API-KEY": localStorage.token,
    },
    body: body ? JSON.stringify(body) : undefined,
  }

  const origin = getOrigin()

  return fetch(origin + pathname, requestObj).then(checkStatusAndParseJson)
}

const getResource = (pathname: string) => fetchResource("GET", pathname)

// export const getTokenInfo = () => getResource(`/me`)
export const getTokenInfo = (pathname: string) => getResource(pathname)
