import { sql } from "@api/core-domain/infra/db/postgres";
import type { DeclarationRaw } from "@api/core-domain/infra/db/raw";
import type { Declaration, DeclarationPK } from "@common/core-domain/domain/Declaration";
import type { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { declarationMap } from "@common/core-domain/mappers/declarationMap";
import { UnexpectedRepositoryError } from "@common/shared-domain";
import type { Any } from "@common/utils/types";

import type { IDeclarationRepo } from "../IDeclarationRepo";

export class PostgresDeclarationRepo implements IDeclarationRepo {
  private sql = sql<DeclarationRaw[]>;
  private table = sql("declaration");

  private nextRequestLimit = 0;
  public limit(limit = 10) {
    this.nextRequestLimit = limit;
    return this;
  }

  public async getAllBySiren(siren: Siren): Promise<Declaration[]> {
    try {
      const [...raw] = await this.sql`select * from ${this.table} where siren=${siren.getValue()} limit ${
        this.requestLimit
      }`;

      return raw.map(declarationMap.toDomain);
    } catch (error: unknown) {
      console.error(error);
      // TODO better error handling
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
    const [...raw] = await this.sql`select * from ${this.table} limit ${this.requestLimit}`;

    return raw.map(declarationMap.toDomain);
  }
  public async getOne([siren, year]: DeclarationPK): Promise<Declaration | null> {
    try {
      const [raw] = await this.sql`select * from ${
        this.table
      } where siren=${siren.getValue()} and year=${year.getValue()} limit 1`;

      if (!raw) return null;
      return declarationMap.toDomain(raw);
    } catch (error: unknown) {
      console.error(error);
      // TODO better error handling
      if ((error as Any).code === "ECONNREFUSED") {
        throw new UnexpectedRepositoryError("Database unreachable. Please verify connection.", error as Error);
      }
      throw error;
    }
  }
  public async save(item: Declaration, deleteDraft = false): Promise<void> {
    const raw = declarationMap.toPersistence(item);
    if (deleteDraft) (raw as Any).draft = null;
    await sql`insert into ${this.table} value ${sql(
      raw,
      "data",
      "declared_at",
      "modified_at",
      "siren",
      "year",
      "declarant",
      "draft",
    )} on conflict ${sql(["siren", "year"])} do update set ${sql(raw, "data", "modified_at", "declarant", "draft")}`;
  }

  public update(item: Declaration): Promise<void> {
    return this.save(item, true);
  }

  private get requestLimit() {
    const ret = this.nextRequestLimit ?? 0;
    this.nextRequestLimit = 0;
    return ret;
  }
}
