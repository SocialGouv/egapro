import type { OwnershipRequestAction } from "@common/core-domain/dtos/OwnershipRequestActionDTO";

import type { OwnershipRequestFormType } from "../../pages/ajout-declarant";
import { fetcherV2 } from "./fetcher";

const buildPayload = (formData: OwnershipRequestFormType) => {
  return {
    askerEmail: formData.askerEmail,
    emails: formData.emails.split(","),
    sirens: formData.sirens.split(","),
  };
};

export const putOwnershipRequest = async (formData: OwnershipRequestFormType) => {
  const url = `/ownership/request`;

  return fetcherV2(url, {
    method: "PUT",
    body: JSON.stringify(buildPayload(formData)),
  });
};

export const acceptOwnershipRequest = async (payload: { action: OwnershipRequestAction; uuids: string[] }) => {
  const url = `/admin/ownership/request`;

  return fetcherV2(url, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};
