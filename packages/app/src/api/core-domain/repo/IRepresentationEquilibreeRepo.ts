import { type RepresentationEquilibree } from "@common/core-domain/domain/RepresentationEquilibree";
import { type Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { type Repo } from "@common/shared-domain";

export interface IRepresentationEquilibreeRepo extends Repo<RepresentationEquilibree> {
  count(): Promise<number>;
  getAllBySiren(siren: Siren): Promise<RepresentationEquilibree[]>;
  limit(limit?: number): this;
  saveWithIndex(item: RepresentationEquilibree): Promise<void>;
}
