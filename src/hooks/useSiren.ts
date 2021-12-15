import useSWR from "swr"
import { genericFetch } from "../utils/fetcher"
import { makeMessage } from "../utils/makeMessage"

const API_SOCIAL_GOUV_SIREN = "https://search-recherche-entreprises.fabrique.social.gouv.fr/api/v1/entreprise/"

/**
 * Fetcher to call the Egapro API
 *
 * @param key the path to use after the API_URL (named key because it is used in cache for useSWR)
 * @param options the request options (optional)
 */
const fetcherSiren = async (siren: string) => {
  return genericFetch(API_SOCIAL_GOUV_SIREN + siren)
}

export function useSiren(siren: string) {
  const { data, error, mutate } = useSWR(siren ? siren : null, fetcherSiren)

  const isLoading = !data && !error
  const isError = Boolean(error)

  const entreprise = data ? { raison_sociale: data.label, adresse: data.firstMatchingEtablissement?.address } : null

  return { entreprise, message: makeMessage(error), isLoading, isError, mutate }
}
