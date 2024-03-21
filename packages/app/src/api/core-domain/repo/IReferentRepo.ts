import { type Referent } from "@common/core-domain/domain/Referent";
import { type Region } from "@common/core-domain/domain/valueObjects/Region";
import { type BulkRepo } from "@common/shared-domain";

export interface IReferentRepo extends BulkRepo<Referent> {
  getOneByRegion(region?: Region): Promise<Referent | null>;
  truncate(): Promise<void>;
}
