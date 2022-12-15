import type { OwnershipRequest } from "@common/core-domain/domain/OwnershipRequest";
import type { BulkRepo } from "@common/shared-domain";

export type IOwnershipRequestRepo = BulkRepo<OwnershipRequest>;
