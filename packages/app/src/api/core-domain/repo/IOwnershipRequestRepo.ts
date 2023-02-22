import type { OwnershipRequest } from "@common/core-domain/domain/OwnershipRequest";
import type {
  GetOwnershipRequestDbOrderBy,
  GetOwnershipRequestInputDTO,
} from "@common/core-domain/dtos/OwnershipRequestDTO";
import type { BulkRepo } from "@common/shared-domain";

export const OWNERSHIP_REQUEST_SORTABLE_COLS = [
  "createdAt",
  "siren",
  "askerEmail",
  "email",
  "status",
  "modifiedAt",
] as const satisfies readonly GetOwnershipRequestDbOrderBy[];

export type OwnershipSearchCriteria = Omit<GetOwnershipRequestInputDTO, "orderBy"> & {
  orderBy?: GetOwnershipRequestDbOrderBy;
};

export interface IOwnershipRequestRepo extends BulkRepo<OwnershipRequest> {
  countSearch({ query, status }: OwnershipSearchCriteria): Promise<number>;
  search({
    query,
    status,
    limit,
    offset,
    orderBy,
    orderDirection,
  }: OwnershipSearchCriteria): Promise<OwnershipRequest[]>;
  updateWithOwnership(item: OwnershipRequest): Promise<void>;
  updateWithOwnershipBulk(...items: OwnershipRequest[]): Promise<void>;
}
