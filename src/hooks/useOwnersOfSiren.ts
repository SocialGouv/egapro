import useSWR from "swr"
import { fetcher } from "../utils/fetcher"
import { genericErrorMessage } from "../utils/makeMessage"

import { useLogoutIfExpiredToken } from "./useLogoutIfExpiredToken"

export function useOwnersOfSiren(siren: string) {
  const { data, error, mutate } = useSWR(siren ? `/ownership/${siren}` : null, fetcher)
  useLogoutIfExpiredToken(error)

  const isLoading = !data && !error
  const isError = Boolean(error)

  return {
    owners: data?.owners?.length ? data.owners : [],
    message: genericErrorMessage(error),
    isLoading,
    isError,
    mutate,
  }
}
