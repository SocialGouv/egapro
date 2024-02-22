import {
  type GetOwnershipRequestDTO,
  type GetOwnershipRequestInputSchemaDTO,
} from "@common/core-domain/dtos/OwnershipRequestDTO";
import useSWR from "swr";

import { type OwnershipRequestListStoreType } from "./useOwnershipRequestListStore";

const ITEMS_PER_PAGE = 10;

type SearchParams = Partial<Omit<OwnershipRequestListStoreType["formState"], "checkedItems" | "globalCheck">>;

const buildKey = (search?: SearchParams) => {
  if (!search) return null;

  const { orderBy, orderDirection, query, status, pageNumber, pageSize } = search;

  const limit = pageSize || ITEMS_PER_PAGE;
  const offset = pageNumber ? pageNumber * limit : 0;

  const params = new URLSearchParams({
    ...(search.orderBy && { orderBy }),
    ...(search.orderDirection && { orderDirection }),
    ...(search.query && { query }),
    ...(search.status && { status }),
    limit: String(limit),
    offset: String(offset),
  } as GetOwnershipRequestInputSchemaDTO);

  return `/admin/ownership/request/?${params.toString()}`;
};

export const useListeDeclarants = (search?: SearchParams) => {
  const { data, error, mutate } = useSWR<GetOwnershipRequestDTO>(buildKey(search), {
    revalidateOnFocus: true,
  });

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
