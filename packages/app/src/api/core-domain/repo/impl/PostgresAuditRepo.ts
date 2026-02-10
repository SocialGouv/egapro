import { db } from "@api/shared-domain/infra/db/drizzle";
import { auditQueryLog } from "@api/shared-domain/infra/db/schema";

import { type IAuditRepo, type SqlOperation } from "../IAuditRepo";

/**
 * PostgreSQL implementation of the audit repository
 */
export class PostgresAuditRepo implements IAuditRepo {
  constructor(private drizzle = db) {}

  /**
   * Log a SQL query on a table that contains email information
   * @param operation The SQL operation (SELECT, INSERT, UPDATE, DELETE)
   * @param tableName The name of the table being queried or modified
   * @param query The SQL query being executed
   * @param params The parameters used in the query
   * @param resultCount The number of results returned by the query (only for SELECT)
   * @param username The username of the authenticated user
   */
  public async logQuery(
    operation: SqlOperation,
    tableName: string,
    query: string,
    params: unknown[],
    resultCount?: number,
    username?: string,
  ): Promise<void> {
    await this.drizzle.insert(auditQueryLog).values({
      username: username || null,
      operation,
      table_name: tableName,
      query,
      params,
      result_count:
        operation === "SELECT" && resultCount !== undefined
          ? resultCount
          : null,
    });
  }

  public async logSelectQuery(
    tableName: string,
    query: string,
    params: unknown[],
    resultCount: number,
    username?: string,
  ): Promise<void> {
    return this.logQuery(
      "SELECT",
      tableName,
      query,
      params,
      resultCount,
      username,
    );
  }

  public async logInsertQuery(
    tableName: string,
    query: string,
    params: unknown[],
    username?: string,
  ): Promise<void> {
    return this.logQuery(
      "INSERT",
      tableName,
      query,
      params,
      undefined,
      username,
    );
  }

  public async logUpdateQuery(
    tableName: string,
    query: string,
    params: unknown[],
    username?: string,
  ): Promise<void> {
    return this.logQuery(
      "UPDATE",
      tableName,
      query,
      params,
      undefined,
      username,
    );
  }

  public async logDeleteQuery(
    tableName: string,
    query: string,
    params: unknown[],
    username?: string,
  ): Promise<void> {
    return this.logQuery(
      "DELETE",
      tableName,
      query,
      params,
      undefined,
      username,
    );
  }
}
