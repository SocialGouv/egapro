import type {
  GetOwnershipRequestDTO,
  GetOwnershipRequestInputSchemaDTO,
} from "@common/core-domain/dtos/OwnershipRequestDTO";
import useSWR from "swr";

import { fetcherV2 } from "./fetcher";
import type { OwnershipRequestListStoreType } from "./useOwnershipRequestListStore";

const ITEMS_PER_PAGE = 10;

type SearchParams = Partial<Omit<OwnershipRequestListStoreType["formState"], "checkedItems" | "globalCheck">>;

const buildKey = (search?: SearchParams) => {
  if (!search) return null;

  const { orderBy, orderDirection, siren, status, pageNumber, pageSize } = search;

  const limit = pageSize || ITEMS_PER_PAGE;
  const offset = pageNumber ? pageNumber * limit : 0;

  const params = new URLSearchParams({
    ...(search.orderBy && { orderBy }),
    ...(search.orderDirection && { orderDirection }),
    ...(search.siren && { siren }),
    ...(search.status && { status }),
    limit: String(limit),
    offset: String(offset),
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
