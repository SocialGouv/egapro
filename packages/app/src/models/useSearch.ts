import useSWRInfinite, { SWRInfiniteKeyLoader } from "swr/infinite"
import moize from "moize"

import type { FetcherInfiniteReturn } from "@/utils/fetcher"
import type { CompaniesType, CompanyType } from "@/types/models/company"

import { fetcher } from "@/utils/fetcher"
import { buildUrlParams } from "@/utils/url"

export type SearchCompanyParams = {
  q?: string
  region?: string
  departement?: string
  section_naf?: string
}

const moizeConfig = {
  maxSize: 1000,
  maxAge: 1000 * 60 * 60, // 1 hour
  isPromise: true,
}

function getKey(search?: SearchCompanyParams) {
  return function (pageIndex: number): ReturnType<SWRInfiniteKeyLoader> {
    if (!search) return null

    const searchParams = buildUrlParams(search)

    if (pageIndex > 0) searchParams.set("offset", String(pageIndex * 10))

    return "/search?" + searchParams.toString()
  }
}

const moizedFetcher = moize(moizeConfig)(fetcher)

export function useSearch(search?: SearchCompanyParams): FetcherInfiniteReturn & { companies: CompaniesType } {
  const { data: companies, error, size, setSize } = useSWRInfinite(getKey(search), moizedFetcher)

  const isLoading = !companies && !error
  const isError = Boolean(error)

  let newData: CompanyType[] = []

  if (companies && companies.length > 0) {
    for (const company of companies) {
      newData = [...newData, ...company.data]
    }
  }

  const flattenCompanies = {
    count: companies?.[0].count,
    data: newData,
  }

  return {
    companies: flattenCompanies,
    error,
    isLoading,
    isError,
    size,
    setSize,
  }
}
