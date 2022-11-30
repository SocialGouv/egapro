import moize from "moize";
import useSWRInfinite from "swr/infinite";

import type { SWRInfiniteKeyLoader } from "swr/infinite";
import { buildUrlParams } from "../../common/utils/url";
import type { FetcherInfiniteReturn } from "./fetcher";

import { fetcher } from "./fetcher";
import type { CompaniesType, CompanyType } from "@common/models/company";

export type SearchCompanyParams = {
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

const getKey = (search?: SearchCompanyParams) => {
  return function (pageIndex: number): ReturnType<SWRInfiniteKeyLoader> {
    if (!search) return null;

    const searchParams = buildUrlParams(search);

    if (pageIndex > 0) searchParams.set("offset", String(pageIndex * 10));

    return "/search?" + searchParams.toString();
  };
};

const moizedFetcher = moize(moizeConfig)(fetcher);

export const useSearch = (search?: SearchCompanyParams): FetcherInfiniteReturn & { companies: CompaniesType } => {
  const { data: companies, error, size, setSize } = useSWRInfinite<CompaniesType>(getKey(search), moizedFetcher);

  const isLoading = !companies && !error;
  const isError = Boolean(error);

  let newData: CompanyType[] = [];

  if (companies && companies.length > 0) {
    for (const company of companies) {
      newData = [...newData, ...company.data];
    }
  }

  const flattenCompanies = {
    count: companies?.[0].count || 0,
    data: newData,
  };

  return {
    companies: flattenCompanies,
    error,
    isLoading,
    isError,
    size,
    setSize,
  };
};