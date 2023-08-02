import type { AppState } from "../globals"
import type { DeclarationDataField } from "../utils/declarationBuilder"
import { ObjectifsMesuresFormSchema } from "../views/private/ObjectifsMesuresPage"

import { fetcherV2, genericFetch } from "./fetcher"

const commonHeaders = {
  Accept: "application/json",
}

const commonContentHeaders = {
  ...commonHeaders,
  "Content-Type": "application/json",
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

async function checkStatusAndParseJson(response: Response): Promise<any> {
  if (response.status === 204) {
    return { response }
  }

  const jsonBody = await response.json() // there's always a body

  if (response.status >= 200 && response.status < 300) {
    return { response, jsonBody }
  }

  throw new ApiError(response, jsonBody, "Erreur dans l'API")
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

  const response = await fetch(getOrigin() + pathname, requestObj)

  return checkStatusAndParseJson(response)
}

const getResource = (pathname: string) => fetchResource("GET", pathname)
const postResource = (pathname: string, body: Record<string, any>) => fetchResource("POST", pathname, body)
const putResource = (pathname: string, body: Record<string, any>) => fetchResource("PUT", pathname, body)

export const getSimulation = (id: string) => getResource(`/simulation/${id}`)

export const postSimulation = (data: AppState | Record<string, never>) => postResource("/simulation", data)

export const putSimulation = (id: string, data: AppState) => putResource(`/simulation/${id}`, { id, data })

export const putDeclaration = (declaration: DeclarationDataField) => {
  const { entreprise, déclaration } = declaration
  return putResource(`/declaration/${entreprise.siren}/${déclaration.année_indicateurs}`, declaration)
}

export const postOpMc = (siren: string, year: string, opmc: ObjectifsMesuresFormSchema) => {
  return fetcherV2(`/declaration/${siren}/${year}/objectifs-mesures`, {
    method: "POST",
    body: JSON.stringify(opmc),
  })
}

export const validateSiren = (siren: string, year?: number | undefined) => {
  return year
    ? getResource(`/validate-siren?siren=${siren}&year=${year}`)
    : getResource(`/validate-siren?siren=${siren}`)
}

/**
 * Return the owners of the given siren. This endpoint returns only if the user is granted.
 * Otherwise, it returns an error.
 *
 * @param {*} siren
 * @returns { owners: string[] }
 */
export const ownersForSiren = (siren: string) => getResource(`/ownership/${siren}`)

// TODO : We made year optional, because state.informations.anneeDeclaration may be undefined in TS type. That seems not good because the endpoint expects a year.
export const resendReceipt = (siren: string, year?: number) => postResource(`/declaration/${siren}/${year}/receipt`, {})

export const sendReceiptObjectifsMesures = (siren: string, year?: number) =>
  postResource(`/declaration/${siren}/${year}/objectifs-receipt`, {})

export const sendValidationEmail = (email: string) =>
  postResource("/token", {
    email,
    path: window.location.pathname,
  })

export const getTokenInfo = () => getResource(`/me`)

// KILL THIS ENDPOINT
export const sendEmailIndicatorsDatas = (id: string, email: string) =>
  postResource(`/simulation/${id}/send-code`, { email })

export const findIndicatorsDataForRaisonSociale = (
  raisonSociale: string,
  { size, from, sortBy, order }: { size: string; from: string; sortBy: string; order: string },
) => {
  const encodedRaisonSociale = encodeURIComponent(raisonSociale)
  return getResource(`/search?q=${encodedRaisonSociale}&size=${size}&from=${from}&sortBy=${sortBy}&order=${order}`)
}

/**
 * Get a token from API for an other user.
 * Only for staff member.
 *
 * @param {*} email
 * @returns { token: string}
 */
export async function generateImpersonateToken(email: string) {
  const origin = getOrigin()
  return genericFetch(origin + `/token?email=${email}`)
}
