import type { OwnershipRequestRaw } from "@api/core-domain/infra/db/raw";
import { sql } from "@api/shared-domain/infra/db/postgres";
import type { OwnershipRequest } from "@common/core-domain/domain/OwnershipRequest";
import { ownershipRequestMap } from "@common/core-domain/mappers/ownershipRequestMap";
import { UnexpectedRepositoryError } from "@common/shared-domain";
import type { UniqueID } from "@common/shared-domain/domain/valueObjects";
import type { Any } from "@common/utils/types";

import type { IOwnershipRequestRepo } from "../IOwnershipRequestRepo";

export class PostgresOwnershipRequestRepo implements IOwnershipRequestRepo {
  private sql = sql<OwnershipRequestRaw[]>;
  private table = sql("ownership_request");

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
    return limit > 0 ? sql`limit ${limit}` : sql``;
  }

  public delete(item: OwnershipRequest): Promise<void> {
    throw new Error("Method not implemented.");
  }
  public exists(id: UniqueID): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  public async getAll(): Promise<OwnershipRequest[]> {
    const raw = await this.sql`select * from ${this.table} ${this.postgresLimit}`;

    return raw.map(ownershipRequestMap.toDomain) as unknown as OwnershipRequest[];
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

    await sql`insert into ${this.table} (siren, email, asker_email, status, error_detail) values ${sql(
      raw,
      "siren",
      "email",
      "asker_email",
      "status",
      "error_detail",
    )}`;
  }

  public async update(item: OwnershipRequest): Promise<void> {
    const raw = ownershipRequestMap.toPersistence(item);

    console.log({ raw });

    await sql`update ${this.table} set ${sql(
      raw,
      "status",
      "error_detail",
    )} where id = ${item._required.id.getValue()}`;
  }

  public deleteBulk(...items: OwnershipRequest[]): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public existsMultiple(...ids: UniqueID[]): Promise<boolean[]> {
    throw new Error("Method not implemented.");
  }

  public async getMultiple(...ids: UniqueID[]): Promise<OwnershipRequest[]> {
    const [...raw] = await this.sql`select * from ${this.table} where id in ${sql(ids.map(id => id.getValue()))}`;

    return raw.map(ownershipRequestMap.toDomain);
  }

  public saveBulk(...items: OwnershipRequest[]): Promise<void> {
    throw new Error("Method not implemented.");
  }

  // TODO: better handle column casting/coercing in "values" because temp table switch everything to text
  public async updateBulk(...items: OwnershipRequest[]): Promise<void> {
    const raws = items.map(ownershipRequestMap.toPersistence);
    const values = raws.map((raw, idx) => [
      items[idx]._required.id.getValue(),
      raw.status,
      raw.error_detail?.length ? JSON.stringify(raw.error_detail) : "null",
    ]);

    await this.sql`update ${
      this.table
    } set status = update_data.status, error_detail = cast(update_data.error_detail as jsonb)
      from (values ${sql(values)}) as update_data (id, status, error_detail)
      where ${this.table}.id = cast(update_data.id as uuid)
    `;
  }
}
