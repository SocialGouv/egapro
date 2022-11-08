import type { FetcherReturn } from "@services/apiClient";
import useSWR from "swr";

import { buildUrlParamsString } from "../../common/utils/url";

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

  const { data, error, mutate } = useSWR<StatsType>(key);

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
