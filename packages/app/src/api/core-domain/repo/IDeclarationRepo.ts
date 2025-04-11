import { type DeclarationRaw } from "@api/core-domain/infra/db/DeclarationRaw";
import { type Declaration, type DeclarationPK } from "@common/core-domain/domain/Declaration";
import { type DeclarationOpmc } from "@common/core-domain/domain/DeclarationOpmc";
import { type Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { type Repo } from "@common/shared-domain";
import { type Email } from "@common/shared-domain/domain/valueObjects";

export interface IDeclarationRepo extends Repo<Declaration> {
  count(): Promise<number>;
  getAllByEmail(emails: Email | Email[]): Promise<Declaration[]>;
  getAllBySiren(siren: Siren): Promise<Declaration[]>;
  getAllSirenAndYear(): Promise<Array<Partial<DeclarationRaw>>>;
  getOneDeclarationOpmc(id: DeclarationPK): Promise<DeclarationOpmc | null>;
  limit(limit?: number): this;
  /** @deprecated - use saveWithIndex */
  save(item: Declaration): Promise<DeclarationPK>;
  saveDeclarationOpmcWithIndex(item: DeclarationOpmc): Promise<void>;
  saveWithIndex(item: Declaration): Promise<void>;
}
