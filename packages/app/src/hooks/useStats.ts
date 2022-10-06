import useSWR from "swr";

import type { FetcherReturn } from "@common/utils/fetcher";

import { fetcher } from "@common/utils/fetcher";
import { buildUrlParamsString } from "@common/utils/url";

export type StatsType = {
  avg: number;
  count: number;
  max: number;
  min: number;
};

export type UseStatsParams = {
  departement?: string;
  region?: string;
  section_naf?: string;
  year?: string;
};

export const useStats = (params?: UseStatsParams): FetcherReturn & { stats: StatsType | undefined } => {
  const urlParams = buildUrlParamsString(params);
  const key = "/stats?" + urlParams;

  const { data, error, mutate } = useSWR<StatsType>(key, fetcher);

  const isLoading = !data && !error;
  const isError = Boolean(error);

  return {
    stats: data,
    error,
    isLoading,
    isError,
    mutate,
  };
};
