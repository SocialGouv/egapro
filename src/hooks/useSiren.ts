import useSWR from "swr"
import { fetcher } from "../utils/fetcher"
import { makeMessage } from "../utils/makeMessage"
import { useLogoutIfExpiredToken } from "./useLogoutIfExpiredToken"

export function useSiren(siren: string) {
  let entreprise, error, mutate

  const result = useSWR(siren ? `/entreprise/${siren}` : null, fetcher)

  if (result?.data) {
    entreprise = result.data
    error = result.error
    mutate = result.mutate
  }
  useLogoutIfExpiredToken(error)

  // Si l'entreprise n'existe pas chez nous, on essaye via l'API Entreprise.
  const resultFromApiEntreprise = useSWR(
    siren && result && result.error ? `/validate-siren?siren=${siren}` : null,
    fetcher,
  )

  if (resultFromApiEntreprise?.data) {
    entreprise = resultFromApiEntreprise.data
    error = resultFromApiEntreprise.error
    mutate = resultFromApiEntreprise.mutate
  }

  useLogoutIfExpiredToken(error)

  const isLoading = !entreprise && !error
  const isError = Boolean(error)

  return { entreprise, message: makeMessage(error), isLoading, isError, mutate }
}
