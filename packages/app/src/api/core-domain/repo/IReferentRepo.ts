import { type Referent } from "@common/core-domain/domain/Referent";
import { type County } from "@common/core-domain/domain/valueObjects/County";
import { type Region } from "@common/core-domain/domain/valueObjects/Region";
import { type BulkRepo } from "@common/shared-domain";

export interface IReferentRepo extends BulkRepo<Referent> {
  getOneByCounty(county?: County): Promise<Referent | null>;
  getOneByRegion(region?: Region): Promise<Referent | null>;
  truncate(): Promise<void>;
}
