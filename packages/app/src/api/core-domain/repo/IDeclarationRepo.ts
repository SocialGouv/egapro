import { type Declaration, type DeclarationPK } from "@common/core-domain/domain/Declaration";
import { type Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { type Repo } from "@common/shared-domain";

export interface IDeclarationRepo extends Repo<Declaration> {
  count(): Promise<number>;
  getAllBySiren(siren: Siren): Promise<Declaration[]>;
  limit(limit?: number): this;
  /** @deprecated - use saveWithIndex */
  save(item: Declaration): Promise<DeclarationPK>;
  saveWithIndex(item: Declaration): Promise<void>;
}
