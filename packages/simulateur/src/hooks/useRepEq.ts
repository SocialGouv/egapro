import useSWR from "swr"

import type { FetcherReturn } from "./types"

import { fetcher } from "../utils/fetcher"
import { genericErrorMessage } from "../utils/makeMessage"
import { AppModels } from "../globals"

export type RepresentationEquilibreeAPI = {
  data: AppModels.DeclarationDTO
  declared_at: number
  modified_at: number
  siren: string
  year: number
}
export function useRepEq(siren: string, year?: number): FetcherReturn & { repEq?: RepresentationEquilibreeAPI } {
  const normalizedSiren = siren && siren.length === 9 ? siren : undefined

  const { data, error, mutate } = useSWR<RepresentationEquilibreeAPI>(
    normalizedSiren && year ? `/representation-equilibree/${normalizedSiren}/${year}` : null,
    fetcher,
    {
      onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
        // Never retry on 404.
        if (error.status === 404) return

        // Never retry on 403 (Forbidden).
        if (error.status === 403) return

        // Never retry on 422 (Unprocessable Entity). SIREN seen invalid by our API.
        if (error.status === 422) return

        // Only retry up to 3 times.
        if (retryCount >= 3) return

        // Retry after 5 seconds.
        setTimeout(() => revalidate({ retryCount }), 5000)
      },
    },
  )

  const isLoading = !data && !error
  const isError = Boolean(error)

  return {
    repEq: data,
    error,
    message: genericErrorMessage(error),
    isLoading,
    isError,
    mutate,
  }
}

export function useRepEqs(siren: string): FetcherReturn & { repEqs: Record<string, RepresentationEquilibreeAPI> } {
  const normalizedSiren = siren && siren.length === 9 ? siren : undefined

  const { data, error, mutate } = useSWR<RepresentationEquilibreeAPI[]>(
    normalizedSiren ? `/representation-equilibree/${normalizedSiren}?limit=-1` : null,
    fetcher,
    {
      onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
        // Never retry on 404.
        if (error.status === 404) return

        // Never retry on 403 (Forbidden).
        if (error.status === 403) return

        // Never retry on 422 (Unprocessable Entity). SIREN seen invalid by our API.
        if (error.status === 422) return

        // Only retry up to 3 times.
        if (retryCount >= 3) return

        // Retry after 5 seconds.
        setTimeout(() => revalidate({ retryCount }), 5000)
      },
    },
  )

  const isLoading = !data && !error
  const isError = Boolean(error)

  const repEqs = !data ? {} : data.reduce((acc, repEq) => ({ ...acc, [String(repEq.year)]: repEq }), {})

  return {
    repEqs,
    error,
    message: genericErrorMessage(error),
    isLoading,
    isError,
    mutate,
  }
}
