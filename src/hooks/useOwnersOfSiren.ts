import useSWR from "swr"
import { useLogoutIfExpiredToken } from "../components/AuthContext"
import { fetcher } from "../utils/fetcher"
import { genericErrorMessage } from "../utils/makeMessage"

export function useOwnersOfSiren(siren: string) {
  const { data, error, mutate } = useSWR<{ owners: Array<string> }>(siren ? `/ownership/${siren}` : null, fetcher)
  useLogoutIfExpiredToken(error)

  const isLoading = !data && !error
  const isError = Boolean(error)

  return {
    owners: data?.owners?.length ? data.owners : [],
    message: genericErrorMessage(error),
    isLoading,
    isError,
    mutate: (emails: string[]) => mutate({ owners: emails }),
  }
}
