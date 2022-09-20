import { buildUrlParamsString } from "@common/utils/url";
import useSWR from "swr";

import type { FetcherReturn } from "./utils";
import { fetcher } from "./utils";

export type StatsType = {
  avg: number;
  count: number;
  max: number;
  min: number;
};

export type StatsParams = {
  departement?: string;
  region?: string;
  section_naf?: string;
  year?: string;
};

export function useStats(params?: StatsParams): FetcherReturn & { stats: StatsType | null } {
  const urlParams = buildUrlParamsString(params);
  const key = "/stats?" + urlParams;

  const { data, error, mutate } = useSWR(key, fetcher);

  const isLoading = !data && !error;
  const isError = Boolean(error);

  return {
    stats: data,
    error,
    isLoading,
    isError,
    mutate,
  };
}
