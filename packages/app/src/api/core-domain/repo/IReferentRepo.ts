import { type Referent } from "@common/core-domain/domain/Referent";
import { type BulkRepo } from "@common/shared-domain";

export interface IReferentRepo extends BulkRepo<Referent> {
  truncate(): Promise<void>;
}
