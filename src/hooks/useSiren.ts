import useSWR from "swr"
import fetcher from "../utils/fetcher"
import { useLogoutIfExpiredToken } from "./useLogoutIfExpiredToken"

export function useSiren(siren: string) {
  const { data: entreprise, error, mutate } = useSWR(siren ? `/validate-siren?siren=${siren}` : null, fetcher)
  useLogoutIfExpiredToken(error)

  const isLoading = !entreprise && !error
  const isError = Boolean(error)

  return { entreprise, error, isLoading, isError, mutate }
}
