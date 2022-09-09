import type { Declaration, DeclarationPK } from "@common/core-domain/domain/Declaration";
import type { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { declarationMap } from "@common/core-domain/mappers/declarationMap";
import { DB } from "api/core-domain/infra/db/knex";

import type { IDeclarationRepo } from "../IDeclarationRepo";

export class KnexPgDeclarationRepo implements IDeclarationRepo {
  private db = DB("declaration");

  private nextRequestLimit = 0;
  public limit(limit = 10) {
    this.nextRequestLimit = limit;
    return this;
  }

  public getAllByPK(pk: DeclarationPK): Promise<Declaration[]> {
    throw new Error("Method not implemented.");
  }

  public async getAllBySiren(siren: Siren): Promise<Declaration[]> {
    const raw = await this.db.select("*").where("siren", siren.getValue()).limit(this.requestLimit);

    return raw.map(declarationMap.toDomain);
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
  public save(item: Declaration): Promise<void> {
    throw new Error("Method not implemented.");
  }
  public update(item: Declaration): Promise<void> {
    throw new Error("Method not implemented.");
  }

  private get requestLimit() {
    const ret = this.nextRequestLimit ?? Infinity;
    this.nextRequestLimit = Infinity;
    return ret;
  }
}
