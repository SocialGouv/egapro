import useSWR from "swr"
import { fetcher } from "../utils/fetcher"
import { genericErrorMessage } from "../utils/makeMessage"
import type { FetcherReturn } from "./types"

export function useDeclaration(siren: string, year: number | undefined): FetcherReturn & { declaration: any } {
  const { data, error, mutate } = useSWR(siren && year ? `/declaration/${siren}/${year}` : null, fetcher)

  const isLoading = !data && !error
  const isError = Boolean(error)

  return {
    declaration: data,
    error,
    message: genericErrorMessage(error),
    isLoading,
    isError,
    mutate,
  }
}
