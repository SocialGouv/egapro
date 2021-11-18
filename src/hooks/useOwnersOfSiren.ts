import useSWR from "swr"
import fetcher from "../utils/fetcher"

export function useOwnersOfSiren(siren: string) {
  const { data, error, mutate } = useSWR(siren ? `/ownership/${siren}` : null, fetcher)

  const isLoading = !data && !error
  const isError = Boolean(error)

  return { owners: data?.owners?.length ? data.owners : [], error, isLoading, isError, mutate }
}
