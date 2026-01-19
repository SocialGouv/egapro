import { type RepresentationEquilibreeRaw } from "@api/core-domain/infra/db/raw";
import { sql } from "@api/shared-domain/infra/db/postgres";
import {
  type RepresentationEquilibree,
  type RepresentationEquilibreePK,
} from "@common/core-domain/domain/RepresentationEquilibree";
import { type Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { representationEquilibreeMap } from "@common/core-domain/mappers/representationEquilibreeMap";
import { type SQLCount, UnexpectedRepositoryError } from "@common/shared-domain";
import { type Any } from "@common/utils/types";

import { type IRepresentationEquilibreeRepo } from "../IRepresentationEquilibreeRepo";
import { PostgresRepresentationEquilibreeSearchRepo } from "./PostgresRepresentationEquilibreeSearchRepo";

export class PostgresRepresentationEquilibreeRepo implements IRepresentationEquilibreeRepo {
  private table = sql("representation_equilibree");
  private sql = sql<RepresentationEquilibreeRaw[]>;

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

  public async getAllBySiren(siren: Siren): Promise<RepresentationEquilibree[]> {
    try {
      const raws = await this.sql`select * from ${this.table} where siren=${siren.getValue()} ${this.postgresLimit}`;

      return raws.map(representationEquilibreeMap.toDomain);
    } catch (error: unknown) {
      console.error(error);
      // TODO better error handling
      if ((error as Any).code === "ECONNREFUSED") {
        throw new UnexpectedRepositoryError("Database unreachable. Please verify connection.", error as Error);
      }
      throw error;
    }
  }

  public async delete([siren, year]: RepresentationEquilibreePK): Promise<void> {
    await this.sql`delete from ${this.table} where siren=${siren.getValue()} and year=${year.getValue()}`;
  }
  public exists(_id: RepresentationEquilibreePK): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  public async getAll(): Promise<RepresentationEquilibree[]> {
    const raw = await this.sql`select * from ${this.table} ${this.postgresLimit}`;

    return raw.map(representationEquilibreeMap.toDomain) as unknown as RepresentationEquilibree[];
  }
  public async getOne([siren, year]: RepresentationEquilibreePK): Promise<RepresentationEquilibree | null> {
    try {
      const [raw] = await this.sql`select * from ${
        this.table
      } where siren=${siren.getValue()} and year=${year.getValue()} limit 1`;

      if (!raw) return null;
      return representationEquilibreeMap.toDomain(raw);
    } catch (error: unknown) {
      console.error(error);
      // TODO better error handling
      if ((error as Any).code === "ECONNREFUSED") {
        throw new UnexpectedRepositoryError("Database unreachable. Please verify connection.", error as Error);
      }
      throw error;
    }
  }

  public async saveWithIndex(item: RepresentationEquilibree): Promise<void> {
    await this.sql.begin(async transac => {
      const thisRepo = new PostgresRepresentationEquilibreeRepo(transac as unknown as typeof sql);
      const searchRepo = new PostgresRepresentationEquilibreeSearchRepo(transac as unknown as typeof sql);
      await thisRepo.save(item);
      await searchRepo.index(item);
    });
  }

  public async save(item: RepresentationEquilibree): Promise<RepresentationEquilibreePK> {
    const raw = representationEquilibreeMap.toPersistence(item);

    const ftRaw: Any = {
      ...raw,
      ft: sql`to_tsvector('ftdict', ${raw.ft})`,
    };
    const insert = sql(ftRaw);
    const update = sql(ftRaw, "data", "modified_at", "ft");
    await this.sql`insert into ${this.table} ${insert} on conflict (siren, year) do update set ${update}`;

    return [item.siren, item.year];
  }

  public async update(item: RepresentationEquilibree): Promise<void> {
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
