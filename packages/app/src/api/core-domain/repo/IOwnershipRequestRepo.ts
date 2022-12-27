import type { OwnershipRequest } from "@common/core-domain/domain/OwnershipRequest";
import type { OwnershipRequestStatus } from "@common/core-domain/domain/valueObjects/ownership_request/OwnershipRequestStatus";
import type { BulkRepo } from "@common/shared-domain";

export const OWNERSHIP_REQUEST_SORTABLE_COLS = {
  date: "created_at",
  siren: "siren",
  demandeur: "asker_email",
  déclarant: "email",
  status: "status",
};

export interface IOwnershipRequestRepo extends BulkRepo<OwnershipRequest> {
  countSearch({ siren, status }: { siren?: string; status?: OwnershipRequestStatus }): Promise<number>;
  search({
    siren,
    status,
    limit,
    offset,
    orderByColumn,
    orderAsc,
  }: {
    limit?: number;
    offset?: number;
    orderAsc?: boolean;
    orderByColumn?: keyof typeof OWNERSHIP_REQUEST_SORTABLE_COLS;
    siren?: string;
    status?: OwnershipRequestStatus;
  }): Promise<OwnershipRequest[]>;
  updateWithOwnership(item: OwnershipRequest): Promise<void>;
  updateWithOwnershipBulk(...items: OwnershipRequest[]): Promise<void>;
}
