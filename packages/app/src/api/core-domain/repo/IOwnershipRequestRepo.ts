import type { OwnershipRequest } from "@common/core-domain/domain/OwnershipRequest";
import type { OwnershipRequestStatus } from "@common/core-domain/domain/valueObjects/ownership_request/OwnershipRequestStatus";
import type { Repo } from "@common/shared-domain";

export interface IOwnershipRequestRepo extends Repo<OwnershipRequest> {
  search({
    siren,
    status,
    limit,
    offset,
  }: {
    limit?: number;
    offset?: number;
    siren: string;
    status?: OwnershipRequestStatus;
  }): Promise<OwnershipRequest[]>;
}
