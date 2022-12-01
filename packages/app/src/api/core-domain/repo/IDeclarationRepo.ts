import type { Declaration } from "@common/core-domain/domain/Declaration";
import type { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import type { Repo } from "@common/shared-domain";

export interface IDeclarationRepo extends Repo<Declaration> {
  getAllBySiren(siren: Siren): Promise<Declaration[]>;
  limit(limit?: number): this;
}
