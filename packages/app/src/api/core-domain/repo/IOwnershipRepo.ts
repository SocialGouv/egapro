import { type Ownership } from "@common/core-domain/domain/Ownership";
import { type Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { type BulkRepo } from "@common/shared-domain";

export interface IOwnershipRepo extends BulkRepo<Ownership> {
  getEmailsAllBySiren(siren: Siren): Promise<string[]>;
}
