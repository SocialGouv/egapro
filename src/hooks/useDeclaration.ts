import useSWR from "swr"
import { fetcher } from "../utils/fetcher"
import { genericErrorMessage } from "../utils/makeMessage"
import type { FetcherReturn } from "./types"

import type { DeclarationTotale } from "../utils/helpers"

export type DeclarationForAPI = {
  siren: string
  year: number
  data: DeclarationTotale
  modified_at: number
  declared_at: number
}

export function useDeclaration(
  siren: string,
  year: number | undefined,
): FetcherReturn & { declaration: DeclarationForAPI } {
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

export function useDeclarations(siren: string): FetcherReturn & { declarations: any } {
  // Naive way to fetch the last 3 declarations. Waiting for the API to have an endpoint to retrieve all declarations for a SIREN.
  const { declaration: declaration2021, error: error2021, isLoading: isLoading2021 } = useDeclaration(siren, 2021)
  const { declaration: declaration2020, error: error2020, isLoading: isLoading2020 } = useDeclaration(siren, 2020)
  const { declaration: declaration2019, error: error2019, isLoading: isLoading2019 } = useDeclaration(siren, 2019)

  if (error2021) console.debug("Pas de déclaration en 2021 ou erreur")
  if (error2020) console.debug("Pas de déclaration en 2020 ou erreur")
  if (error2019) console.debug("Pas de déclaration en 2019 ou erreur")

  const isLoading = isLoading2021 && isLoading2020 && isLoading2019

  return {
    declarations: {
      ...(declaration2021 && { 2021: declaration2021 }),
      ...(declaration2020 && { 2020: declaration2020 }),
      ...(declaration2019 && { 2019: declaration2019 }),
    },
    isLoading,
    error: null,
    isError: false,
    message: null,
    // eslint-disable-next-line
    mutate: () => {},
  }
}
