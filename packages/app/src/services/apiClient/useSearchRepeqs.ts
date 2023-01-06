import type {
  motifNonCalculabiliteCadresOptions,
  motifNonCalculabiliteMembresOptions,
} from "@common/models/representation-equilibree";
import moize from "moize";
import type { SWRInfiniteKeyLoader } from "swr/infinite";
import useSWRInfinite from "swr/infinite";

import { buildUrlParams } from "../../common/utils/url";
import type { FetcherInfiniteReturn } from "./fetcher";
import { fetcher } from "./fetcher";

export type RepeqType = {
  entreprise: {
    code_naf: string;
    département: string;
    raison_sociale: string;
    région: string;
    siren: string;
  };
  label?: string;
  représentation_équilibrée: Record<
    number,
    {
      motif_non_calculabilité_cadres: typeof motifNonCalculabiliteCadresOptions[number]["value"] | null;
      motif_non_calculabilité_membres: typeof motifNonCalculabiliteMembresOptions[number]["value"] | null;
      pourcentage_femmes_cadres: number | null;
      pourcentage_femmes_membres: number | null;
      pourcentage_hommes_cadres: number | null;
      pourcentage_hommes_membres: number | null;
    }
  >;
};
export type RepeqsType = {
  count: number;
  data: RepeqType[];
};

export type SearchParams = {
  departement?: string;
  q?: string;
  region?: string;
  section_naf?: string;
};

const moizeConfig = {
  maxSize: 1000,
  maxAge: 1000 * 60 * 60, // 1 hour
  isPromise: true,
};

const getKey = (search?: SearchParams) => {
  return function (pageIndex: number): ReturnType<SWRInfiniteKeyLoader> {
    if (!search) return null;

    const searchParams = buildUrlParams(search);

    if (pageIndex > 0) searchParams.set("offset", String(pageIndex * 10));

    return "/representation-equilibree/search?" + searchParams.toString();
  };
};

const moizedFetcher = moize(moizeConfig)(fetcher);

/**
 * Hoook to search into representation equilibree table.
 */
export const useSearchRepeqs = (search?: SearchParams): FetcherInfiniteReturn & { repeqs: RepeqsType } => {
  const { data: repeqs, error, size, setSize, mutate } = useSWRInfinite<RepeqsType>(getKey(search), moizedFetcher);

  const isLoading = Boolean(search) && !repeqs && !error;

  const isError = Boolean(error);

  let newData: RepeqType[] = [];

  if (repeqs && repeqs.length > 0) {
    for (const repeq of repeqs) {
      newData = [...newData, ...repeq.data];
    }
  }

  const flattenRepeqs = {
    count: repeqs?.[0].count || 0,
    data: newData,
  };

  return {
    repeqs: flattenRepeqs,
    error,
    isLoading,
    isError,
    size,
    setSize,
    mutate,
  };
};
