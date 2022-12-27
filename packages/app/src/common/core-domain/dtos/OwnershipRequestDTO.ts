import type { OwnershipRequestStatus } from "../domain/valueObjects/ownership_request/OwnershipRequestStatus";

export type OwnershipRequestDTO = {
  askerEmail: string;
  createdAt: string;
  email?: string;
  id: string;
  modifiedAt: string;
  siren?: string;
  status: OwnershipRequestStatus.Enum;
};

export type GetOwnershipRequestDTO = {
  data: OwnershipRequestDTO[];
  params: {
    limit: number;
    offset: number;
    orderAsc: boolean;
    orderByColumn: string;
    siren?: string;
    status?: OwnershipRequestStatus.Enum;
  };
  totalCount: number;
  warnings?: Array<readonly [string, string]>;
};
