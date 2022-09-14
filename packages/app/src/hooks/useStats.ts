import useSWR from "swr"

import { fetcher, FetcherReturn } from "./utils"
import { buildUrlParamsString } from "@common/utils/url"

export type StatsType = {
  avg: number
  count: number
  max: number
  min: number
}

export type StatsParams = {
  region?: string
  departement?: string
  section_naf?: string
  year?: string
}

export function useStats(params?: StatsParams): FetcherReturn & { stats: StatsType | null } {
  const urlParams = buildUrlParamsString(params)
  const key = "/stats?" + urlParams

  const { data, error, mutate } = useSWR(key, fetcher)

  const isLoading = !data && !error
  const isError = Boolean(error)

  return {
    stats: data,
    error,
    isLoading,
    isError,
    mutate,
  }
}
