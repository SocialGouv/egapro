import useSWR from "swr"
import fetcher from "../utils/fetcher"

export function useSiren(siren: string) {
  const { data: entreprise, error, mutate } = useSWR(siren ? `/validate-siren?siren=${siren}` : null, fetcher)

  const isLoading = !entreprise && !error
  const isError = Boolean(error)

  return { entreprise, error, isLoading, isError, mutate }
}
