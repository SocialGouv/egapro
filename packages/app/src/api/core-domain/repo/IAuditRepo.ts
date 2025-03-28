/**
 * Type for SQL operation
 */
export type SqlOperation = "DELETE" | "INSERT" | "SELECT" | "UPDATE";

/**
 * Interface for the audit repository
 * This repository is responsible for logging database queries to the audit.query_log table
 */
export interface IAuditRepo {
  /**
   * Log a SQL query on a table that contains email information
   * @param operation The SQL operation (SELECT, INSERT, UPDATE, DELETE)
   * @param tableName The name of the table being queried or modified
   * @param query The SQL query being executed
   * @param params The parameters used in the query
   * @param resultCount The number of results returned by the query (only for SELECT)
   * @param username The username of the authenticated user
   */
  logQuery(
    operation: SqlOperation,
    tableName: string,
    query: string,
    params: unknown[],
    resultCount?: number,
    username?: string,
  ): Promise<void>;
}
