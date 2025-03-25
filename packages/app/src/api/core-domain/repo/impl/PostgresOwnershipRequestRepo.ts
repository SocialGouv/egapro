import { type OwnershipRequestRaw } from "@api/core-domain/infra/db/raw";
import { auditRepo } from "@api/core-domain/repo";
import { sql } from "@api/shared-domain/infra/db/postgres";
import { Ownership } from "@common/core-domain/domain/Ownership";
import { type OwnershipRequest } from "@common/core-domain/domain/OwnershipRequest";
import { OwnershipRequestStatus } from "@common/core-domain/domain/valueObjects/ownership_request/OwnershipRequestStatus";
import { type GetOwnershipRequestDbOrderBy } from "@common/core-domain/dtos/OwnershipRequestDTO";
import { ownershipRequestMap } from "@common/core-domain/mappers/ownershipRequestMap";
import { type SQLCount, UnexpectedRepositoryError } from "@common/shared-domain";
import { UniqueID } from "@common/shared-domain/domain/valueObjects";
import { type Any, ensureRequired } from "@common/utils/types";

import { type IOwnershipRequestRepo, type OwnershipSearchCriteria } from "../IOwnershipRequestRepo";
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
    // Exécuter la requête
    const raws = await this.sql`select * from ${this.table} ${this.postgresLimit}`;

    // Log the SELECT query to the audit table since it contains email information
    await auditRepo.logQuery(
      "SELECT",
      "ownership_request",
      `select * from ownership_request`,
      [],
      raws.length,
      undefined, // Will be filled by the calling context if available
    );

    return raws.map(ownershipRequestMap.toDomain);
  }

  public async getOne(id: UniqueID): Promise<OwnershipRequest | null> {
    try {
      // Paramètres de la requête
      const idValue = id.getValue();

      // Exécuter la requête
      const [raw] = await this.sql`select * from ${this.table} where id = ${idValue} limit 1`;

      // Log the SELECT query to the audit table since it contains email information
      await auditRepo.logQuery(
        "SELECT",
        "ownership_request",
        `select * from ownership_request where id = $1 limit 1`,
        [idValue],
        raw ? 1 : 0,
        undefined, // Will be filled by the calling context if available
      );

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
    // Paramètres de la requête
    const raw = ownershipRequestMap.toPersistence(item);

    // Exécuter la requête
    const insert = sql(raw, "siren", "email", "asker_email", "status", "error_detail");
    const [rawReturn] = await this.sql`insert into ${this.table} ${insert} returning *`;

    // Log the INSERT query to the audit table
    await auditRepo.logQuery(
      "INSERT",
      "ownership_request",
      `INSERT INTO ownership_request (siren, email, asker_email, status, error_detail) VALUES ($1, $2, $3, $4, $5)`,
      [raw.siren, raw.email, raw.asker_email, raw.status, raw.error_detail],
      undefined,
      undefined, // Will be filled by the calling context if available
    );

    return new UniqueID(rawReturn.id);
  }

  public async update(item: OwnershipRequest): Promise<void> {
    // Paramètres de la requête
    const raw = ownershipRequestMap.toPersistence(item);
    const idValue = ensureRequired(item).id.getValue();

    // Exécuter la requête
    await sql`update ${this.table} set ${sql(raw, "status", "error_detail")} where id = ${idValue}`;

    // Log the UPDATE query to the audit table
    await auditRepo.logQuery(
      "UPDATE",
      "ownership_request",
      `UPDATE ownership_request SET status = $1, error_detail = $2 WHERE id = $3`,
      [raw.status, raw.error_detail, idValue],
      undefined,
      undefined, // Will be filled by the calling context if available
    );
  }

  public async updateWithOwnership(item: OwnershipRequest): Promise<void> {
    await this.sql.begin(async transac => {
      const ownership = new Ownership({
        email: item.email!,
        siren: item.siren!,
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
              email: item.email!,
              siren: item.siren!,
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
    // Paramètres de la requête
    const idValues = ids.map(id => id.getValue());

    // Exécuter la requête
    const raws = await this.sql`select * from ${this.table} where id in ${sql(idValues)}`;

    // Log the SELECT query to the audit table since it contains email information
    await auditRepo.logQuery(
      "SELECT",
      "ownership_request",
      `select * from ownership_request where id in ($1)`,
      [idValues],
      raws.length,
      undefined, // Will be filled by the calling context if available
    );

    return raws.map(ownershipRequestMap.toDomain);
  }

  public saveBulk(..._items: OwnershipRequest[]): Promise<UniqueID[]> {
    throw new Error("Method not implemented.");
  }

  // TODO: better handle column casting/coercing in "values" because temp table switch everything to text
  public async updateBulk(...items: OwnershipRequest[]): Promise<void> {
    // Paramètres de la requête
    const raws = items.map(ownershipRequestMap.toPersistence);
    const values = raws.map((raw, idx) => [
      ensureRequired(items[idx]).id.getValue(),
      raw.status,
      raw.error_detail,
    ]) as Any;

    // Exécuter la requête
    await this.sql`update ${
      this.table
    } set status = update_data.status, error_detail = cast(update_data.error_detail as jsonb)
      from (values ${sql(values)}) as update_data (id, status, error_detail)
      where ${this.table}.id = cast(update_data.id as uuid)
    `;

    // Log the UPDATE query to the audit table
    await auditRepo.logQuery(
      "UPDATE",
      "ownership_request",
      `UPDATE ownership_request SET status = update_data.status, error_detail = update_data.error_detail
       FROM (VALUES ${items.map((_, idx) => `($${idx * 3 + 1}, $${idx * 3 + 2}, $${idx * 3 + 3})`).join(", ")}) 
       AS update_data (id, status, error_detail)
       WHERE ownership_request.id = update_data.id`,
      values.flat(),
      undefined,
      undefined, // Will be filled by the calling context if available
    );
  }

  public async search({
    query,
    status,
    limit,
    offset,
    orderBy,
    orderDirection,
  }: OwnershipSearchCriteria): Promise<OwnershipRequest[]> {
    // Paramètres de la requête
    const searchParams = { query, status, limit, offset, orderBy, orderDirection };

    // Construire les clauses SQL
    const sqlOrderBy =
      orderBy && orderDirection
        ? sql`order by ${sql(OWNERSHIP_REQUEST_SORTABLE_COLS_MAP[orderBy])} ${
            orderDirection === "desc" ? sql`desc` : sql`asc`
          }`
        : sql``;
    const sqlLimit = limit ? sql`limit ${limit}` : sql``;
    const sqlOffset = offset ? sql`offset ${offset}` : sql``;
    const sqlWhereClause = this.buildSearchWhereClause({ query, status });

    // Exécuter la requête
    const rows = await this.sql`select * from ${this.table} ${sqlWhereClause} ${sqlOrderBy} ${sqlLimit} ${sqlOffset}`;

    // Construct the query string for audit logging
    const queryString = `select * from ownership_request where (${QUERYABLE_COLS.join(
      " ilike '%" + query + "%' or ",
    )} ilike '%${query}%') ${status ? `and status='${status}'` : ""} ${
      orderBy && orderDirection ? `order by ${OWNERSHIP_REQUEST_SORTABLE_COLS_MAP[orderBy]} ${orderDirection}` : ""
    } ${limit ? `limit ${limit}` : ""} ${offset ? `offset ${offset}` : ""}`;

    // Log the SELECT query to the audit table since it contains email information
    await auditRepo.logQuery(
      "SELECT",
      "ownership_request",
      queryString,
      [query, status, limit, offset, orderBy, orderDirection],
      rows.length,
      undefined, // Will be filled by the calling context if available
    );

    return rows.map(ownershipRequestMap.toDomain);
  }

  public async countSearch({ query, status }: OwnershipSearchCriteria): Promise<number> {
    // Paramètres de la requête
    const searchParams = { query, status };

    // Construire la clause WHERE
    const sqlWhereClause = this.buildSearchWhereClause(searchParams);

    // Exécuter la requête
    const [{ count }] = await sql<SQLCount>`select count(*) from ${this.table} ${sqlWhereClause}`;

    // Construct the query string for audit logging
    const queryString = `select count(*) from ownership_request where (${QUERYABLE_COLS.join(
      " ilike '%" + query + "%' or ",
    )} ilike '%${query}%') ${status ? `and status='${status}'` : ""}`;

    // Log the SELECT query to the audit table since it contains email information
    await auditRepo.logQuery(
      "SELECT",
      "ownership_request",
      queryString,
      [query, status],
      1, // Always returns 1 row with the count
      undefined, // Will be filled by the calling context if available
    );

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
