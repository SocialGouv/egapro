import { type DeclarationRaw } from "@api/core-domain/infra/db/DeclarationRaw";
import { sql } from "@api/shared-domain/infra/db/postgres";
import { type Declaration, type DeclarationPK } from "@common/core-domain/domain/Declaration";
import { type Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { declarationMap } from "@common/core-domain/mappers/declarationMap";
import { type SQLCount, UnexpectedRepositoryError } from "@common/shared-domain";
import { type Any } from "@common/utils/types";

import { type IDeclarationRepo } from "../IDeclarationRepo";
import { PostgresDeclarationSearchRepo } from "./PostgresDeclarationSearchRepo";

export class PostgresDeclarationRepo implements IDeclarationRepo {
  private sql = sql<DeclarationRaw[]>;
  private table = sql("declaration");

  constructor(sqlInstance?: typeof sql) {
    if (sqlInstance) {
      this.sql = sqlInstance;
    }
  }

  private nextRequestLimit = 0;
  public limit(limit = 10) {
    this.nextRequestLimit = limit;
    return this;
  }

  public async getAllBySiren(siren: Siren): Promise<Declaration[]> {
    try {
      const raws = await this.sql`select * from ${this.table} where siren=${siren.getValue()} ${this.postgresLimit}`;

      return raws.map(declarationMap.toDomain);
    } catch (error: unknown) {
      console.error(error);
      // TODO better error handling
      if ((error as Any).code === "ECONNREFUSED") {
        throw new UnexpectedRepositoryError("Database unreachable. Please verify connection.", error as Error);
      }
      throw error;
    }
  }

  public delete(_id: DeclarationPK): Promise<void> {
    throw new Error("Method not implemented.");
  }
  public exists(_id: DeclarationPK): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  public async getAll(): Promise<Declaration[]> {
    const raws = await this.sql`select * from ${this.table} ${this.postgresLimit}`;

    return raws.map(declarationMap.toDomain);
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

  // TODO faire une fonction qui sauve la décla + index dans la table search.

  public async saveWithIndex(item: Declaration): Promise<void> {
    await this.sql.begin(async transac => {
      const thisRepo = new PostgresDeclarationRepo(transac);
      const searchRepo = new PostgresDeclarationSearchRepo(transac);
      await thisRepo.save(item);
      await searchRepo.index(item);
    });
  }

  /** Prefer use saveWithIndex if you want to synchronize the search */
  public async save(item: Declaration): Promise<DeclarationPK> {
    const raw = declarationMap.toPersistence(item);

    const ftRaw: Any = {
      ...raw,
      ft: sql`to_tsvector('ftdict', ${raw.ft})`,
    };

    const insert = sql(ftRaw, "data", "declared_at", "modified_at", "siren", "year", "declarant", "ft");
    const update = sql(ftRaw, "data", "modified_at", "declarant", "ft");

    await this.sql`insert into ${this.table} ${insert} on conflict (siren, year) do update set ${update}`;

    return [item.siren, item.year];
  }

  public async update(item: Declaration): Promise<void> {
    await this.save(item);
  }

  public async count(): Promise<number> {
    const [{ count }] = await sql<SQLCount>`select count(*) from ${this.table}`;
    return Number(count);
  }

  private get requestLimit() {
    const ret = this.nextRequestLimit ?? 0;
    this.nextRequestLimit = 0;
    return ret;
  }

  private get postgresLimit() {
    const limit = this.requestLimit;
    return limit > 0 ? sql`limit ${limit}` : sql``;
  }
}
