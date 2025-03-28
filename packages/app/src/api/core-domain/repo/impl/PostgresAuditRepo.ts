import { sql as _sql } from "@api/shared-domain/infra/db/postgres";

import { type IAuditRepo, type SqlOperation } from "../IAuditRepo";

/**
 * PostgreSQL implementation of the audit repository
 */
export class PostgresAuditRepo implements IAuditRepo {
  constructor(private sql = _sql) {}

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
    try {
      // Prepare the SQL query with the new column structure
      await this.sql`
        INSERT INTO audit.query_log (
          username, 
          operation, 
          table_name, 
          query, 
          params, 
          result_count
        )
        VALUES (
          ${username || null},
          ${operation},
          ${tableName},
          ${query},
          ${JSON.stringify(params)},
          ${operation === "SELECT" && resultCount !== undefined ? resultCount : null}
        )
      `;
    } catch (error) {
      console.error("Error logging to audit table:", error);
      // We don't want to throw an error if logging fails
      // as it shouldn't affect the main functionality
    }
  }

  // Backward compatibility methods

  public async logSelectQuery(
    tableName: string,
    query: string,
    params: unknown[],
    resultCount: number,
    username?: string,
  ): Promise<void> {
    return this.logQuery("SELECT", tableName, query, params, resultCount, username);
  }

  public async logInsertQuery(tableName: string, query: string, params: unknown[], username?: string): Promise<void> {
    return this.logQuery("INSERT", tableName, query, params, undefined, username);
  }

  public async logUpdateQuery(tableName: string, query: string, params: unknown[], username?: string): Promise<void> {
    return this.logQuery("UPDATE", tableName, query, params, undefined, username);
  }

  public async logDeleteQuery(tableName: string, query: string, params: unknown[], username?: string): Promise<void> {
    return this.logQuery("DELETE", tableName, query, params, undefined, username);
  }
}
