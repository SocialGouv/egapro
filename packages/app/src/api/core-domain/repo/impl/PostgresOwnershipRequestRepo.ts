import type { OwnershipRequestRaw } from "@api/core-domain/infra/db/raw";
import { sql } from "@api/shared-domain/infra/db/postgres";
import { Ownership } from "@common/core-domain/domain/Ownership";
import type { OwnershipRequest } from "@common/core-domain/domain/OwnershipRequest";
import { OwnershipRequestStatus } from "@common/core-domain/domain/valueObjects/ownership_request/OwnershipRequestStatus";
import type { GetOwnershipRequestDbOrderBy } from "@common/core-domain/dtos/OwnershipRequestDTO";
import { ownershipRequestMap } from "@common/core-domain/mappers/ownershipRequestMap";
import type { SQLCount } from "@common/shared-domain";
import { UnexpectedRepositoryError } from "@common/shared-domain";
import { UniqueID } from "@common/shared-domain/domain/valueObjects";
import type { Any } from "@common/utils/types";
import { ensureRequired } from "@common/utils/types";

import type { IOwnershipRequestRepo, OwnershipSearchCriteria } from "../IOwnershipRequestRepo";
import { PostgresOwnershipRepo } from "./PostgresOwnershipRepo";

const OWNERSHIP_REQUEST_SORTABLE_COLS_MAP: Record<GetOwnershipRequestDbOrderBy, keyof OwnershipRequestRaw> = {
  createdAt: "created_at",
  siren: "siren",
  askerEmail: "asker_email",
  email: "email",
  status: "status",
  modifiedAt: "modified_at",
};

const QUERYABLE_COLS: Array<keyof OwnershipRequestRaw> = ["asker_email", "siren", "email"];

export class PostgresOwnershipRequestRepo implements IOwnershipRequestRepo {
  private table = sql("ownership_request");
  private sql = sql<OwnershipRequestRaw[]>;

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

  private get requestLimit() {
    const ret = this.nextRequestLimit ?? 0;
    this.nextRequestLimit = 0;
    return ret;
  }

  private get postgresLimit() {
    const limit = this.requestLimit;
    return limit > 0 ? sql`limit ${limit}` : sql``;
  }

  public delete(_id: UniqueID): Promise<void> {
    throw new Error("Method not implemented.");
  }
  public exists(_id: UniqueID): Promise<boolean> {
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

  public async save(item: OwnershipRequest): Promise<UniqueID> {
    const raw = ownershipRequestMap.toPersistence(item);

    const insert = sql(raw, "siren", "email", "asker_email", "status", "error_detail");
    const [rawReturn] = await this.sql`insert into ${this.table} ${insert} returning *`;

    return new UniqueID(rawReturn.id);
  }

  public async update(item: OwnershipRequest): Promise<void> {
    const raw = ownershipRequestMap.toPersistence(item);

    await sql`update ${this.table} set ${sql(raw, "status", "error_detail")} where id = ${ensureRequired(
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
      const ownerships = items
        .filter(element => element.status.getValue() === OwnershipRequestStatus.Enum.ACCEPTED)
        .map(
          item =>
            new Ownership({
              email: item.email!, // eslint-disable-line @typescript-eslint/no-non-null-assertion -- let it throw
              siren: item.siren!, // eslint-disable-line @typescript-eslint/no-non-null-assertion -- let it throw
            }),
        );
      const ownershipRepo = new PostgresOwnershipRepo(transac);
      const thisRepo = new PostgresOwnershipRequestRepo(transac);

      if (ownerships.length) await ownershipRepo.saveBulk(...ownerships);
      await thisRepo.updateBulk(...items);
    });
  }

  public deleteBulk(..._ids: UniqueID[]): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public existsMultiple(..._ids: UniqueID[]): Promise<boolean[]> {
    throw new Error("Method not implemented.");
  }

  public async getMultiple(...ids: UniqueID[]): Promise<OwnershipRequest[]> {
    const raws = await this.sql`select * from ${this.table} where id in ${sql(ids.map(id => id.getValue()))}`;

    return raws.map(ownershipRequestMap.toDomain);
  }

  public saveBulk(..._items: OwnershipRequest[]): Promise<UniqueID[]> {
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
      from (values ${sql(values)}) as update_data (id, status, error_detail)
      where ${this.table}.id = cast(update_data.id as uuid)
    `;
  }

  public async search({
    query,
    status,
    limit,
    offset,
    orderBy,
    orderDirection,
  }: OwnershipSearchCriteria): Promise<OwnershipRequest[]> {
    const sqlOrderBy =
      orderBy && orderDirection
        ? sql`order by ${sql(OWNERSHIP_REQUEST_SORTABLE_COLS_MAP[orderBy])} ${
            orderDirection === "desc" ? sql`desc` : sql`asc`
          }`
        : sql``;
    const sqlLimit = limit ? sql`limit ${limit}` : sql``;
    const sqlOffset = offset ? sql`offset ${offset}` : sql``;
    const sqlWhereClause = this.buildSearchWhereClause({ query, status });

    const rows = await this.sql`select * from ${this.table} ${sqlWhereClause} ${sqlOrderBy} ${sqlLimit} ${sqlOffset}`;

    return rows.map(ownershipRequestMap.toDomain);
  }

  public async countSearch({ query, status }: OwnershipSearchCriteria): Promise<number> {
    const sqlWhereClause = this.buildSearchWhereClause({ query, status });
    const [{ count }] = await sql<SQLCount>`select count(*) from ${this.table} ${sqlWhereClause}`;

    return Number(count);
  }

  private buildSearchWhereClause({ query = "", status }: OwnershipSearchCriteria) {
    const sqlQuery = sql`(${QUERYABLE_COLS.reduce(
      (prev, col, idx) => sql`${prev} ${idx === 0 ? sql`` : sql`or`} ${sql(col)} ilike ${"%" + query + "%"}`,
      sql``,
    )})`;
    const sqlStatus = status ? sql`and status=${status}` : sql``;

    return sql`where ${sqlQuery} ${sqlStatus}`;
  }
}
