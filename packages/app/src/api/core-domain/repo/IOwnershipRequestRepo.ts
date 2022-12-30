import type { OwnershipRequest } from "@common/core-domain/domain/OwnershipRequest";
import type {
  GetOwnershipRequestInputDTO,
  GetOwnershipRequestInputOrderBy,
} from "@common/core-domain/dtos/OwnershipRequestDTO";
import type { BulkRepo } from "@common/shared-domain";

export const OWNERSHIP_REQUEST_SORTABLE_COLS = [
  "createdAt",
  "siren",
  "askerEmail",
  "email",
  "status",
  "modifiedAt",
] as const satisfies readonly GetOwnershipRequestInputOrderBy[];

export type OwnershipSearchCriteria = GetOwnershipRequestInputDTO;

export interface IOwnershipRequestRepo extends BulkRepo<OwnershipRequest> {
  countSearch({ siren, status }: OwnershipSearchCriteria): Promise<number>;
  search({
    siren,
    status,
    limit,
    offset,
    orderBy,
    orderDirection,
  }: OwnershipSearchCriteria): Promise<OwnershipRequest[]>;
  updateWithOwnership(item: OwnershipRequest): Promise<void>;
  updateWithOwnershipBulk(...items: OwnershipRequest[]): Promise<void>;
}
