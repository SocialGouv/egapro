import useSWR from "swr"

import type { DeclarationAPI } from "../utils/declarationBuilder"
import type { FetcherReturn } from "./types"

import { fetcher } from "../utils/fetcher"
import { genericErrorMessage } from "../utils/makeMessage"

export function useDeclaration(
  siren: string,
  year: number | undefined,
): FetcherReturn & { declaration: DeclarationAPI | undefined } {
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
  // Naive way to fetch the last 3 declarations. Waiting for the API to have an endpoint to retrieve all declarations for a SIREN.
  const { declaration: declaration2021, error: error2021, isLoading: isLoading2021 } = useDeclaration(siren, 2021)
  const { declaration: declaration2020, error: error2020, isLoading: isLoading2020 } = useDeclaration(siren, 2020)
  const { declaration: declaration2019, error: error2019, isLoading: isLoading2019 } = useDeclaration(siren, 2019)

  if (error2021) console.debug("Pas de déclaration en 2021 ou erreur")
  if (error2020) console.debug("Pas de déclaration en 2020 ou erreur")
  if (error2019) console.debug("Pas de déclaration en 2019 ou erreur")

  const isLoading = isLoading2021 && isLoading2020 && isLoading2019

  // data.déclaration.brouillon == true uniquement pour les déclarations faites via la déclaration directe et non finalisées.
  return {
    declarations: {
      ...(declaration2021 && declaration2021.data.déclaration.brouillon !== true && { 2021: declaration2021 }),
      ...(declaration2020 && declaration2020.data.déclaration.brouillon !== true && { 2020: declaration2020 }),
      ...(declaration2019 && declaration2019.data.déclaration.brouillon !== true && { 2019: declaration2019 }),
    },
    isLoading,
    error: null,
    isError: false,
    message: null,
    // eslint-disable-next-line
    mutate: () => {},
  }
}
