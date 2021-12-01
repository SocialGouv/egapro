import useSWR from "swr"
import { fetcher } from "../utils/fetcher"
import { makeMessage } from "../utils/makeMessage"
import { useLogoutIfExpiredToken } from "./useLogoutIfExpiredToken"

export function useSiren(siren: string) {
  const { data: entreprise, error, mutate } = useSWR(siren ? `/validate-siren?siren=${siren}` : null, fetcher)
  useLogoutIfExpiredToken(error)

  const isLoading = !entreprise && !error
  const isError = Boolean(error)

  return { entreprise, message: makeMessage(error), isLoading, isError, mutate }
}
