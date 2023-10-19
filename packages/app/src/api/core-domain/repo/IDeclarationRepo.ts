import { type Declaration, type DeclarationPK } from "@common/core-domain/domain/Declaration";
import { type DeclarationOpmc } from "@common/core-domain/domain/DeclarationOpmc";
import { type Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { type Repo } from "@common/shared-domain";

export interface IDeclarationRepo extends Repo<Declaration> {
  count(): Promise<number>;
  getAllBySiren(siren: Siren): Promise<Declaration[]>;
  getOneDeclarationOpmc(id: DeclarationPK): Promise<DeclarationOpmc | null>;
  limit(limit?: number): this;
  /** @deprecated - use saveWithIndex */
  save(item: Declaration): Promise<DeclarationPK>;
  saveDeclarationOpmcWithIndex(item: DeclarationOpmc): Promise<void>;
  saveWithIndex(item: Declaration): Promise<void>;
}
