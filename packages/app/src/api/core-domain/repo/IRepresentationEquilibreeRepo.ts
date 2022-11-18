import type {
  RepresentationEquilibree,
  RepresentationEquilibreePK,
} from "@common/core-domain/domain/RepresentationEquilibree";
import type { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import type { Repo } from "@common/shared-domain";

export interface IRepresentationEquilibreeRepo extends Repo<RepresentationEquilibree> {
  getAllByPK(pk: RepresentationEquilibreePK): Promise<RepresentationEquilibree[]>;
  getAllBySiren(siren: Siren): Promise<RepresentationEquilibree[]>;
  limit(limit?: number): this;
}
