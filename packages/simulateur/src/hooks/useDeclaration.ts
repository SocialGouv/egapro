import useSWR from "swr"

import type { DeclarationAPI } from "../utils/declarationBuilder"
import type { FetcherReturn } from "./types"

import { fetcher } from "../utils/fetcher"
import { genericErrorMessage } from "../utils/makeMessage"

export function useDeclaration(siren?: string, year?: number): FetcherReturn & { declaration?: DeclarationAPI } {
  const normalizedSiren = siren && siren.length === 9 ? siren : undefined

  const { data, error, mutate } = useSWR<DeclarationAPI>(
    normalizedSiren && year ? `/declaration/${normalizedSiren}/${year}` : null,
    fetcher,
    {
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
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
    declaration: data,
    error,
    message: genericErrorMessage(error),
    isLoading,
    isError,
    mutate,
  }
}

export function useDeclarations(siren: string): FetcherReturn & { declarations: Record<string, DeclarationAPI> } {
  const normalizedSiren = siren && siren.length === 9 ? siren : undefined

  const { data, error, mutate } = useSWR<DeclarationAPI[]>(
    normalizedSiren ? `/declarations/${normalizedSiren}?limit=-1` : null,
    fetcher,
    {
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
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

  const dataWithoutDrafts = data?.filter((declaration) => Boolean(declaration.declared_at))

  const declarations = !dataWithoutDrafts
    ? {}
    : dataWithoutDrafts.reduce((acc, declaration) => ({ ...acc, [String(declaration.year)]: declaration }), {})

  return {
    declarations,
    error,
    message: genericErrorMessage(error),
    isLoading,
    isError,
    mutate,
  }
}
