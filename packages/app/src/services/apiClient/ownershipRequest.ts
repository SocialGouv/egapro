import type { CreateOwnershipRequestDTO } from "@common/core-domain/dtos/CreateOwnershipRequestDTO";
import type { OwnershipRequestAction } from "@common/core-domain/dtos/OwnershipRequestActionDTO";

import { fetcherV2 } from "./fetcher";

export const putOwnershipRequest = async (formData: CreateOwnershipRequestDTO) => {
  const url = `/ownership/request`;

  return fetcherV2(url, {
    method: "PUT",
    body: JSON.stringify(formData),
  });
};

export const acceptOwnershipRequest = async (payload: { action: OwnershipRequestAction; uuids: string[] }) => {
  const url = `/admin/ownership/request`;

  return fetcherV2(url, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};
