import type { GetOwnershipRequestDTO } from "@common/core-domain/dtos/OwnershipRequestDTO";
import { removeUndefined } from "@common/utils/object";
import useSWR from "swr";

import { fetcherV2 } from "./fetcher";

type SearchParams = Partial<{
  limit: string;
  offset: string;
  orderBy: string;
  orderDirection: string;
  siren: string;
  status: string;
}>;

const buildKey = (search?: SearchParams, itemsPerPage = 10, pageNumber = 0) => {
  if (!search) return null;

  const params = new URLSearchParams({
    ...removeUndefined(search),
    limit: String(itemsPerPage),
    offset: String(pageNumber * itemsPerPage),
  });

  return `/admin/ownership/request?${params.toString()}`;
};
// FetcherReturn & { requests?: GetOwnershipRequestDTO }
export const useListeDeclarants = (search?: SearchParams, itemsPerLoad = 10, pageNumber = 0) => {
  const { data, error, mutate } = useSWR<GetOwnershipRequestDTO>(buildKey(search, itemsPerLoad, pageNumber), fetcherV2);

  const isError = !!error;
  const isLoading = !!search && !data && !isError;

  return {
    requests: data,
    error,
    isLoading,
    isError,
    mutate,
  };
};
