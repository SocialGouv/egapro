import { PostgresAuditRepo } from "@api/core-domain/repo/impl/PostgresAuditRepo";
import { db } from "@api/shared-domain/infra/db/drizzle";
import { auditQueryLog } from "@api/shared-domain/infra/db/schema";
import { sql } from "drizzle-orm";

describe("PostgresAuditRepo (drizzle)", () => {
  beforeAll(async () => {
    await db.execute(sql.raw("create schema if not exists audit;"));
    await db.execute(
      sql.raw(`create table if not exists audit.query_log (
        username text,
        operation text not null,
        table_name text not null,
        query text not null,
        params jsonb not null,
        result_count int,
        created_at timestamp with time zone default now()
      );`),
    );
  });

  beforeEach(async () => {
    await db.execute(sql.raw("truncate table audit.query_log;"));
  });

  it("logQuery inserts into audit.query_log with expected column names", async () => {
    const repo = new PostgresAuditRepo(db);

    await repo.logQuery(
      "SELECT",
      "ownership",
      "select * from ownership where siren=$1",
      ["123456782"],
      2,
      "user@example.com",
    );

    const rows = await db.select().from(auditQueryLog);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.table_name).toBe("ownership");
    expect(rows[0]?.result_count).toBe(2);
    expect(rows[0]?.operation).toBe("SELECT");
    expect(rows[0]?.username).toBe("user@example.com");
  });
});
