import { getDatabase } from "@api/core-domain/infra/db/knex";
import type { Declaration, DeclarationPK } from "@common/core-domain/domain/Declaration";
import type { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { declarationMap } from "@common/core-domain/mappers/declarationMap";
import { UnexpectedRepositoryError } from "@common/shared-domain";
import type { Any } from "@common/utils/types";

import type { IDeclarationRepo } from "../IDeclarationRepo";

export class KnexPgDeclarationRepo implements IDeclarationRepo {
  private db = getDatabase()("declaration");

  private nextRequestLimit = 0;
  public limit(limit = 10) {
    this.nextRequestLimit = limit;
    return this;
  }

  public getAllByPK(pk: DeclarationPK): Promise<Declaration[]> {
    throw new Error("Method not implemented.");
  }

  public async getAllBySiren(siren: Siren): Promise<Declaration[]> {
    try {
      const raw = await this.db.select("*").where("siren", siren.getValue()).limit(this.requestLimit);

      return raw.map(declarationMap.toDomain);
    } catch (error: unknown) {
      console.error(error);
      if ((error as Any).code === "ECONNREFUSED") {
        throw new UnexpectedRepositoryError("Database unreachable. Please verify connection.", error as Error);
      }
      throw error;
    }
  }

  public delete(item: Declaration): Promise<void> {
    throw new Error("Method not implemented.");
  }
  public exists(id: DeclarationPK): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  public async getAll(): Promise<Declaration[]> {
    const raw = await this.db.select("*");

    return raw.map(declarationMap.toDomain);
  }
  public getOne(id: DeclarationPK): Promise<Declaration | null> {
    throw new Error("Method not implemented.");
  }
  public async save(item: Declaration): Promise<void> {
    const raw = declarationMap.toPersistence(item);
    await this.db.insert(raw);
  }
  public update(item: Declaration): Promise<void> {
    throw new Error("Method not implemented.");
  }

  private get requestLimit() {
    const ret = this.nextRequestLimit ?? 0;
    this.nextRequestLimit = 0;
    return ret;
  }
}
