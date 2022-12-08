import { sql } from "@api/core-domain/infra/db/postgres";
import type { OwnershipRequestRaw } from "@api/core-domain/infra/db/raw";
import type { OwnershipRequest, OwnershipRequestPK } from "@common/core-domain/domain/OwnershipRequest";
import { ownershipRequestMap } from "@common/core-domain/mappers/ownershipRequestMap";
import { UnexpectedRepositoryError } from "@common/shared-domain";
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
  public exists([siren, email]: OwnershipRequestPK): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  public async getAll(): Promise<OwnershipRequest[]> {
    const raw = await this.sql`select * from ${this.table} ${this.postgresLimit}`;

    return raw.map(ownershipRequestMap.toDomain) as unknown as OwnershipRequest[];
  }

  public async getOne([siren, email]: OwnershipRequestPK): Promise<OwnershipRequest | null> {
    try {
      const [raw] = await this.sql`select * from ${
        this.table
      } where siren=${siren.getValue()} and email=${email.getValue()} limit 1`;

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
    await sql`insert into ${this.table} ${sql(
      raw,
      "siren",
      "email",
      "asker_email",
      "status",
      "error_detail",
    )} on conflict ${sql(["siren", "email"])} do update set ${sql(raw, "modified_at", "status", "error_detail")}`;
  }

  // See Multiple updates in one query in https://www.npmjs.com/package/postgres#queries
  // ON CONFLICT with excluded row. https://stackoverflow.com/a/68133518/2728710
  public async saveAll(items: OwnershipRequest[]): Promise<void> {
    // const raws = items.map(item => ownershipRequestMap.toPersistence(item));
    throw new Error("Method not implemented.");
  }

  public update(item: OwnershipRequest): Promise<void> {
    return this.save(item);
  }
}
