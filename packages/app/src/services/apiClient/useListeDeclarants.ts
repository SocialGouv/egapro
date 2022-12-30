import type { GetOwnershipRequestDTO, OwnershipRequestDTO } from "@common/core-domain/dtos/OwnershipRequestDTO";
import { buildUrlParams } from "@common/utils/url";
import type { SWRInfiniteKeyLoader } from "swr/infinite";
import useSWRInfinite from "swr/infinite";

import type { FetcherInfiniteReturn } from "./fetcher";
import { fetcherV2 } from "./fetcher";

type SearchParams = {
  orderBy?: string;
  orderDirection?: string;
  siren?: string;
  status?: string;
};

const getKey = (search?: SearchParams, itemsPerLoad = 10): SWRInfiniteKeyLoader => {
  return (index: number) => {
    if (!search) return null;

    const searchParams = buildUrlParams(search);

    if (index > 0) searchParams.set("offset", `${index * itemsPerLoad}`);
    searchParams.set("limit", `${itemsPerLoad}`);

    return `/admin/ownership/request?${searchParams.toString()}`;
  };
};

export const useListeDeclarants = (
  search?: SearchParams,
  itemsPerLoad = 10,
): FetcherInfiniteReturn & { requests: GetOwnershipRequestDTO } => {
  const {
    data: requests,
    error,
    size,
    setSize,
  } = useSWRInfinite<GetOwnershipRequestDTO>(getKey(search, itemsPerLoad), fetcherV2);

  const isError = !!error;
  const isLoading = !!search && !requests && !isError;

  const newData: OwnershipRequestDTO[] = [];

  for (const req of requests ?? []) {
    newData.push(...req.data);
  }

  return {
    requests: {
      totalCount: requests?.[0].totalCount ?? 0,
      data: newData,
      warnings: requests?.[0].warnings,
      params: requests?.[0].params ?? {},
    },
    error,
    isLoading,
    isError,
    size,
    setSize,
  };
};
