import type { OwnershipRequest } from "@common/core-domain/domain/OwnershipRequest";
import type { BulkRepo } from "@common/shared-domain";

export interface IOwnershipRequestRepo extends BulkRepo<OwnershipRequest> {
  updateWithOwnership(item: OwnershipRequest): Promise<void>;
  updateWithOwnershipBulk(...items: OwnershipRequest[]): Promise<void>;
}
