import type { OwnershipRequestRaw } from "@api/core-domain/infra/db/raw";
import { sql as _sql } from "@api/shared-domain/infra/db/postgres";
import { Ownership } from "@common/core-domain/domain/Ownership";
import type { OwnershipRequest } from "@common/core-domain/domain/OwnershipRequest";
import { ownershipRequestMap } from "@common/core-domain/mappers/ownershipRequestMap";
import { UnexpectedRepositoryError } from "@common/shared-domain";
import type { UniqueID } from "@common/shared-domain/domain/valueObjects";
import type { Any } from "@common/utils/types";
import { ensureRequired } from "@common/utils/types";

import type { IOwnershipRequestRepo } from "../IOwnershipRequestRepo";
import { PostgresOwnershipRepo } from "./PostgresOwnershipRepo";

export class PostgresOwnershipRequestRepo implements IOwnershipRequestRepo {
  private table = _sql("ownership_request");

  constructor(private sql = _sql<OwnershipRequestRaw[]>) {}

  private nextRequestLimit = 0;
  public limit(limit = 10) {
    this.nextRequestLimit = limit;
    return this;
  }

  private get requestLimit() {
    const ret = this.nextRequestLimit ?? 0;
    this.nextRequestLimit = 0;
    return ret;
  }

  private get postgresLimit() {
    const limit = this.requestLimit;
    return limit > 0 ? _sql`limit ${limit}` : _sql``;
  }

  public delete(item: OwnershipRequest): Promise<void> {
    throw new Error("Method not implemented.");
  }
  public exists(id: UniqueID): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  public async getAll(): Promise<OwnershipRequest[]> {
    const raws = await this.sql`select * from ${this.table} ${this.postgresLimit}`;

    return raws.map(ownershipRequestMap.toDomain);
  }

  public async getOne(id: UniqueID): Promise<OwnershipRequest | null> {
    try {
      const [raw] = await this.sql`select * from ${this.table} where id = ${id.getValue()} limit 1`;

      if (!raw) return null;
      return ownershipRequestMap.toDomain(raw);
    } catch (error: unknown) {
      console.error(error);
      // TODO better error handling
      if ((error as Any).code === "ECONNREFUSED") {
        throw new UnexpectedRepositoryError("Database unreachable. Please verify connection.", error as Error);
      }
      throw error;
    }
  }

  public async save(item: OwnershipRequest): Promise<void> {
    const raw = ownershipRequestMap.toPersistence(item);

    await _sql`insert into ${this.table} ${_sql(raw, "siren", "email", "asker_email", "status", "error_detail")}`;
  }

  public async update(item: OwnershipRequest): Promise<void> {
    const raw = ownershipRequestMap.toPersistence(item);

    await _sql`update ${this.table} set ${_sql(raw, "status", "error_detail")} where id = ${ensureRequired(
      item,
    ).id.getValue()}`;
  }

  public async updateWithOwnership(item: OwnershipRequest): Promise<void> {
    await this.sql.begin(async transac => {
      const ownership = new Ownership({
        email: item.email!, // eslint-disable-line @typescript-eslint/no-non-null-assertion -- let it throw
        siren: item.siren!, // eslint-disable-line @typescript-eslint/no-non-null-assertion -- let it throw
      });
      const ownershipRepo = new PostgresOwnershipRepo(transac);
      const thisRepo = new PostgresOwnershipRequestRepo(transac);
      await ownershipRepo.save(ownership);
      await thisRepo.update(item);
    });
  }

  public async updateWithOwnershipBulk(...items: OwnershipRequest[]): Promise<void> {
    await this.sql.begin(async transac => {
      const ownerships = items.map(
        item =>
          new Ownership({
            email: item.email!, // eslint-disable-line @typescript-eslint/no-non-null-assertion -- let it throw
            siren: item.siren!, // eslint-disable-line @typescript-eslint/no-non-null-assertion -- let it throw
          }),
      );
      const ownershipRepo = new PostgresOwnershipRepo(transac);
      const thisRepo = new PostgresOwnershipRequestRepo(transac);
      await ownershipRepo.saveBulk(...ownerships);
      await thisRepo.updateBulk(...items);
    });
  }

  public deleteBulk(...items: OwnershipRequest[]): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public existsMultiple(...ids: UniqueID[]): Promise<boolean[]> {
    throw new Error("Method not implemented.");
  }

  public async getMultiple(...ids: UniqueID[]): Promise<OwnershipRequest[]> {
    const [{ count }] = await _sql<[{ count: number }]>`select count(*) from ${this.table}`;
    console.log({ count });
    const raws = await this.sql`select * from ${this.table} where id in ${_sql(ids.map(id => id.getValue()))}`;

    return raws.map(ownershipRequestMap.toDomain);
  }

  public saveBulk(...items: OwnershipRequest[]): Promise<void> {
    throw new Error("Method not implemented.");
  }

  // TODO: better handle column casting/coercing in "values" because temp table switch everything to text
  public async updateBulk(...items: OwnershipRequest[]): Promise<void> {
    const raws = items.map(ownershipRequestMap.toPersistence);
    const values = raws.map((raw, idx) => [
      ensureRequired(items[idx]).id.getValue(),
      raw.status,
      raw.error_detail,
    ]) as Any;

    await this.sql`update ${
      this.table
    } set status = update_data.status, error_detail = cast(update_data.error_detail as jsonb)
      from (values ${_sql(values)}) as update_data (id, status, error_detail)
      where ${this.table}.id = cast(update_data.id as uuid)
    `;
  }
}
