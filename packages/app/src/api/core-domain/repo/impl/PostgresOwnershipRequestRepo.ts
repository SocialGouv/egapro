import { sql } from "@api/core-domain/infra/db/postgres";
import type { OwnershipRequestRaw } from "@api/core-domain/infra/db/raw";
import type { OwnershipRequest } from "@common/core-domain/domain/OwnershipRequest";
import type { OwnershipRequestStatus } from "@common/core-domain/domain/valueObjects/ownership_request/OwnershipRequestStatus";
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
      const [raw] = await this.sql`select * from ${this.table} where id=${id.getValue()} limit 1`;

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

  public update(item: OwnershipRequest): Promise<void> {
    return this.save(item);
  }

  public async search({
    siren = "",
    status,
    limit = 10,
    offset = 0,
  }: {
    limit?: number;
    offset?: number;
    siren: string;
    status?: OwnershipRequestStatus;
  }): Promise<OwnershipRequest[]> {
    const statusFilter = status?.getValue() ? sql` and status = ${status?.getValue()}` : sql``;

    const rows = await this.sql`select * from ${this.table} where siren like ${
      siren + "%"
    } ${statusFilter} limit ${limit} offset ${offset}`;

    return rows.map(ownershipRequestMap.toDomain);
  }
}
