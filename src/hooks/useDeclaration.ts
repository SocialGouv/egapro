import useSWR from "swr"
import { fetcher } from "../utils/fetcher"
import { genericErrorMessage } from "../utils/makeMessage"

export function useDeclaration(siren: string, year: number | undefined) {
  const { data, error } = useSWR(siren && year ? `/declaration/${siren}/${year}` : null, fetcher)

  const isLoading = !data && !error
  const isError = Boolean(error)

  return {
    declaration: data,
    message: genericErrorMessage(error),
    isLoading,
    isError,
  }
}
