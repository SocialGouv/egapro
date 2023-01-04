import type {
  GetOwnershipRequestDTO,
  GetOwnershipRequestInputSchemaDTO,
} from "@common/core-domain/dtos/OwnershipRequestDTO";
import { removeEmpty, removeUndefined } from "@common/utils/object";
import useSWR from "swr";

import { fetcherV2 } from "./fetcher";

const ITEMS_PER_PAGE = 10;

type SearchParams = Partial<{
  orderBy: string;
  orderDirection: string;
  pageNumber: number;
  pageSize: number;
  siren: string;
  status: string;
}>;

const buildKey = (search?: SearchParams) => {
  if (!search) return null;

  const newSearch: SearchParams = removeEmpty(removeUndefined(search));

  const pageSize = newSearch.pageSize || ITEMS_PER_PAGE;
  const offset = newSearch?.pageNumber ? newSearch.pageNumber * pageSize : 0;

  const params = new URLSearchParams({
    offset: String(offset),
    limit: String(pageSize),
    ...newSearch,
  } as GetOwnershipRequestInputSchemaDTO);

  return `/admin/ownership/request/?${params.toString()}`;
};

export const useListeDeclarants = (search?: SearchParams) => {
  const { data, error, mutate } = useSWR<GetOwnershipRequestDTO>(buildKey(search), fetcherV2);

  const isError = !!error;
  const isLoading = !!search && !data && !isError;

  return {
    fetchedItems: data,
    error,
    isLoading,
    isError,
    mutate,
  };
};
