import { type OwnershipRequestRaw } from "@api/core-domain/infra/db/raw";
import { auditRepo } from "@api/core-domain/repo";
import { db } from "@api/shared-domain/infra/db/drizzle";
import { ownershipRequest } from "@api/shared-domain/infra/db/schema";
import { Ownership } from "@common/core-domain/domain/Ownership";
import { type OwnershipRequest } from "@common/core-domain/domain/OwnershipRequest";
import { OwnershipRequestStatus } from "@common/core-domain/domain/valueObjects/ownership_request/OwnershipRequestStatus";
import { type GetOwnershipRequestDbOrderBy } from "@common/core-domain/dtos/OwnershipRequestDTO";
import { ownershipRequestMap } from "@common/core-domain/mappers/ownershipRequestMap";
import { UnexpectedRepositoryError } from "@common/shared-domain";
import { UniqueID } from "@common/shared-domain/domain/valueObjects";
import { type Any, ensureRequired } from "@common/utils/types";
import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";

import {
  type IOwnershipRequestRepo,
  type OwnershipSearchCriteria,
} from "../IOwnershipRequestRepo";
import { PostgresOwnershipRepo } from "./PostgresOwnershipRepo";

const OWNERSHIP_REQUEST_SORTABLE_COLS_MAP: Record<
  GetOwnershipRequestDbOrderBy,
  (typeof ownershipRequest)[keyof typeof ownershipRequest]
> = {
  createdAt: ownershipRequest.created_at,
  siren: ownershipRequest.siren,
  askerEmail: ownershipRequest.asker_email,
  email: ownershipRequest.email,
  status: ownershipRequest.status,
  modifiedAt: ownershipRequest.modified_at,
};

const QUERYABLE_COLS = [
  ownershipRequest.asker_email,
  ownershipRequest.siren,
  ownershipRequest.email,
] as const;

export class PostgresOwnershipRequestRepo implements IOwnershipRequestRepo {
  constructor(private drizzle: typeof db = db) {}

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

  public delete(_id: UniqueID): Promise<void> {
    throw new Error("Method not implemented.");
  }
  public exists(_id: UniqueID): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  public async getAll(): Promise<OwnershipRequest[]> {
    const limit = this.requestLimit;
    const query = this.drizzle.select().from(ownershipRequest);
    const raws = (limit > 0
      ? await query.limit(limit)
      : await query) as unknown as OwnershipRequestRaw[];

    auditRepo.logQuery(
      "PostgresOwnershipRequestRepo.getAll",
      "ownership_request",
      `select * from ownership_request`,
      [],
      raws.length,
      undefined,
    );

    return raws.map(ownershipRequestMap.toDomain);
  }

  public async getOne(id: UniqueID): Promise<OwnershipRequest | null> {
    try {
      const idValue = id.getValue();

      const [raw] = (await this.drizzle
        .select()
        .from(ownershipRequest)
        .where(eq(ownershipRequest.id, idValue))
        .limit(1)) as unknown as OwnershipRequestRaw[];

      auditRepo.logQuery(
        "PostgresOwnershipRequestRepo.getOne",
        "ownership_request",
        `select * from ownership_request where id = $1 limit 1`,
        [idValue],
        raw ? 1 : 0,
        undefined,
      );

      if (!raw) return null;
      return ownershipRequestMap.toDomain(raw);
    } catch (error: unknown) {
      console.error(error);
      // TODO better error handling
      if ((error as Any).code === "ECONNREFUSED") {
        throw new UnexpectedRepositoryError(
          "Database unreachable. Please verify connection.",
          error as Error,
        );
      }
      throw error;
    }
  }

  public async save(item: OwnershipRequest): Promise<UniqueID> {
    const raw = ownershipRequestMap.toPersistence(item);

    // Insert only the writable columns (the raw type also contains DB-managed columns).
    const insertValues = {
      siren: raw.siren,
      email: raw.email,
      asker_email: raw.asker_email,
      status: raw.status,
      error_detail: raw.error_detail,
    };

    const [rawReturn] = (await this.drizzle
      .insert(ownershipRequest)
      .values(insertValues)
      .returning({ id: ownershipRequest.id })) as unknown as Array<{
      id: string;
    }>;

    auditRepo.logQuery(
      "PostgresOwnershipRequestRepo.save",
      "ownership_request",
      `INSERT INTO ownership_request (siren, email, asker_email, status, error_detail) VALUES ($1, $2, $3, $4, $5)`,
      [raw.siren, raw.email, raw.asker_email, raw.status, raw.error_detail],
      undefined,
      undefined,
    );

    return new UniqueID(rawReturn.id);
  }

  public async update(item: OwnershipRequest): Promise<void> {
    const raw = ownershipRequestMap.toPersistence(item);
    const idValue = ensureRequired(item).id.getValue();

    await this.drizzle
      .update(ownershipRequest)
      .set({ status: raw.status, error_detail: raw.error_detail })
      .where(eq(ownershipRequest.id, idValue));

    auditRepo.logQuery(
      "PostgresOwnershipRequestRepo.update",
      "ownership_request",
      `UPDATE ownership_request SET status = $1, error_detail = $2 WHERE id = $3`,
      [raw.status, raw.error_detail, idValue],
      undefined,
      undefined,
    );
  }

  public async updateWithOwnership(item: OwnershipRequest): Promise<void> {
    await this.drizzle.transaction(async (transac) => {
      const ownership = new Ownership({
        email: item.email!,
        siren: item.siren!,
      });
      const ownershipRepo = new PostgresOwnershipRepo(
        transac as unknown as typeof db,
      );
      const thisRepo = new PostgresOwnershipRequestRepo(
        transac as unknown as typeof db,
      );
      await ownershipRepo.save(ownership);
      await thisRepo.update(item);
    });
  }

  public async updateWithOwnershipBulk(
    ...items: OwnershipRequest[]
  ): Promise<void> {
    await this.drizzle.transaction(async (transac) => {
      const ownerships = items
        .filter(
          (element) =>
            element.status.getValue() === OwnershipRequestStatus.Enum.ACCEPTED,
        )
        .map(
          (item) =>
            new Ownership({
              email: item.email!,
              siren: item.siren!,
            }),
        );
      const ownershipRepo = new PostgresOwnershipRepo(
        transac as unknown as typeof db,
      );
      const thisRepo = new PostgresOwnershipRequestRepo(
        transac as unknown as typeof db,
      );

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
    const idValues = ids.map((id) => id.getValue());

    const raws = (await this.drizzle
      .select()
      .from(ownershipRequest)
      .where(
        inArray(ownershipRequest.id, idValues),
      )) as unknown as OwnershipRequestRaw[];

    auditRepo.logQuery(
      "PostgresOwnershipRequestRepo.getMultiple",
      "ownership_request",
      `select * from ownership_request where id in ($1)`,
      [idValues],
      raws.length,
      undefined,
    );

    return raws.map(ownershipRequestMap.toDomain);
  }

  public saveBulk(..._items: OwnershipRequest[]): Promise<UniqueID[]> {
    throw new Error("Method not implemented.");
  }

  // TODO: better handle column casting/coercing in "values" because temp table switch everything to text
  public async updateBulk(...items: OwnershipRequest[]): Promise<void> {
    const raws = items.map(ownershipRequestMap.toPersistence);

    const valuesTuples = raws.map((raw, idx) => {
      const id = ensureRequired(items[idx]).id.getValue();
      const errorDetailJson = raw.error_detail
        ? JSON.stringify(raw.error_detail)
        : null;
      return sql`(${id}, ${raw.status}, ${errorDetailJson})`;
    });

    await this.drizzle.execute(sql`
      update ${ownershipRequest}
      set
        status = update_data.status,
        error_detail = cast(update_data.error_detail as jsonb)
      from (values ${sql.join(valuesTuples, sql`, `)}) as update_data (id, status, error_detail)
      where ${ownershipRequest}.id = cast(update_data.id as uuid)
    `);

    auditRepo.logQuery(
      "PostgresOwnershipRequestRepo.updateBulk",
      "ownership_request",
      `UPDATE ownership_request SET status = update_data.status, error_detail = update_data.error_detail
       FROM (VALUES ${items
         .map((_, idx) => `($${idx * 3 + 1}, $${idx * 3 + 2}, $${idx * 3 + 3})`)
         .join(", ")}) 
       AS update_data (id, status, error_detail)
       WHERE ownership_request.id = update_data.id`,
      valuesTuples as unknown as unknown[],
      undefined,
      undefined,
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
    const where = this.buildSearchWhereClause({ query, status });

    let q: Any = this.drizzle.select().from(ownershipRequest).where(where);

    if (orderBy && orderDirection) {
      const col = OWNERSHIP_REQUEST_SORTABLE_COLS_MAP[orderBy];
      q = q.orderBy(
        orderDirection === "desc" ? desc(col as Any) : asc(col as Any),
      );
    }

    if (limit) q = q.limit(limit);
    if (offset) q = q.offset(offset);

    const rows = (await q) as unknown as OwnershipRequestRaw[];

    const queryString = `select * from ownership_request where (${[
      "asker_email",
      "siren",
      "email",
    ].join(" ilike '%" + query + "%'")} ilike '%${query}%') ${
      status ? `and status='${status}'` : ""
    } ${
      orderBy && orderDirection
        ? `order by ${String(orderBy)} ${orderDirection}`
        : ""
    } ${limit ? `limit ${limit}` : ""} ${offset ? `offset ${offset}` : ""}`;

    auditRepo.logQuery(
      "PostgresOwnershipRequestRepo.search",
      "ownership_request",
      queryString,
      [query, status, limit, offset, orderBy, orderDirection],
      rows.length,
      undefined,
    );

    return rows.map(ownershipRequestMap.toDomain);
  }

  public async countSearch({
    query,
    status,
  }: OwnershipSearchCriteria): Promise<number> {
    const where = this.buildSearchWhereClause({ query, status });

    const [{ count }] = (await this.drizzle
      .select({ count: sql<number>`count(*)::int` })
      .from(ownershipRequest)
      .where(where)) as unknown as Array<{ count: number }>;

    const queryString = `select count(*) from ownership_request where (${[
      "asker_email",
      "siren",
      "email",
    ].join(" ilike '%" + query + "%' or ")} ilike '%${query}%') ${
      status ? `and status='${status}'` : ""
    }`;

    auditRepo.logQuery(
      "PostgresOwnershipRequestRepo.countSearch",
      "ownership_request",
      queryString,
      [query, status],
      1,
      undefined,
    );

    return Number(count);
  }

  private buildSearchWhereClause({
    query = "",
    status,
  }: OwnershipSearchCriteria) {
    const q = `%${query}%`;
    const queryCondition = or(
      ...QUERYABLE_COLS.map((col) => ilike(col as Any, q)),
    );
    return status
      ? and(queryCondition, eq(ownershipRequest.status, status))
      : queryCondition;
  }
}
