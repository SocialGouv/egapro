import { genericFetch } from "./fetcher"

const commonHeaders = {
  Accept: "application/json",
}

const commonContentHeaders = {
  ...commonHeaders,
  "Content-Type": "application/json",
}

////////////

class ApiError extends Error {
  constructor(response, jsonBody, ...params) {
    super(...params)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError)
    }
    this.response = response
    this.jsonBody = jsonBody
    this.name = "ApiError"
  }
}

function checkStatusAndParseJson(response) {
  if (response.status === 204) {
    return { response }
  }

  let jsonPromise = response.json() // there's always a body
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

  if (process.env.REACT_APP_EGAPRO_API_URL) origin = process.env.REACT_APP_EGAPRO_API_URL

  return origin
}

/////////////

function fetchResource(method, pathname, body) {
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

const getResource = (pathname) => fetchResource("GET", pathname)
const postResource = (pathname, body) => fetchResource("POST", pathname, body)
const putResource = (pathname, body) => fetchResource("PUT", pathname, body)

/////////////

export const getIndicatorsDatas = (id) => getResource(`/simulation/${id}`)

export const postIndicatorsDatas = (data) => postResource("/simulation", data)

export const putIndicatorsDatas = (id, data) => putResource(`/simulation/${id}`, { id, data })

export const putDeclaration = (data) =>
  putResource(`/declaration/${data.entreprise.siren}/${data.déclaration.année_indicateurs}`, data)

export const validateSiren = (siren) => getResource(`/validate-siren?siren=${siren}`)

/**
 * Return the owners of the given siren. This endpoint returns only if the user is granted.
 * Otherwise, it returns an error.
 *
 * @param {*} siren
 * @returns { owners: string[] }
 */
export const ownersForSiren = (siren) => getResource(`/ownership/${siren}`)

export const resendReceipt = (siren, year) => postResource(`/declaration/${siren}/${year}/receipt`, {})

export const sendValidationEmail = (email) =>
  postResource("/token", {
    email,
    url: `${window.location.href}?token=`,
  })

export const getTokenInfo = () => getResource(`/me`)

// KILL THIS ENDPOINT
export const sendEmailIndicatorsDatas = (id, email) => postResource(`/simulation/${id}/send-code`, { email })

export const findIndicatorsDataForRaisonSociale = (raisonSociale, { size, from, sortBy, order }) => {
  const encodedRaisonSociale = encodeURIComponent(raisonSociale)
  return getResource(`/search?q=${encodedRaisonSociale}&size=${size}&from=${from}&sortBy=${sortBy}&order=${order}`)
}

// TODO : migrate all this business functions in model directory ?

/**
 * Get a token from API for an other user.
 * Only for staff member.
 *
 * @param {*} email
 * @returns { token: string}
 */
export async function generateImpersonateToken(email) {
  const origin = getOrigin()
  return genericFetch(origin + `/token?email=${email}`)
}
