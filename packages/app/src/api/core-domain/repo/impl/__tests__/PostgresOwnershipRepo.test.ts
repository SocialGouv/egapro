import { PostgresOwnershipRepo } from "@api/core-domain/repo/impl/PostgresOwnershipRepo";
import { db } from "@api/shared-domain/infra/db/drizzle";
import { ownership } from "@api/shared-domain/infra/db/schema";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { Email } from "@common/shared-domain/domain/valueObjects/Email";
import { sql } from "drizzle-orm";

describe("PostgresOwnershipRepo (drizzle)", () => {
  beforeAll(async () => {
    // Minimal schema for this repo + audit logger.
    await db.execute(
      sql.raw(`create table if not exists ownership (
        siren text not null,
        email text not null,
        primary key (siren, email)
      );`),
    );

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
    await db.delete(ownership);
  });

  it("getAllEmailsBySiren returns emails from the ownership table", async () => {
    await db.insert(ownership).values([
      { siren: "123456782", email: "a@example.com" },
      { siren: "123456782", email: "b@example.com" },
    ]);

    const repo = new PostgresOwnershipRepo(db);
    const emails = await repo.getAllEmailsBySiren(new Siren("123456782"));
    expect(emails.sort()).toEqual(["a@example.com", "b@example.com"]);
  });

  it("addSirens inserts rows (idempotent)", async () => {
    const repo = new PostgresOwnershipRepo(db);

    await repo.addSirens(new Email("owner@example.com"), [
      "123456782",
      "123456790",
    ]);
    await repo.addSirens(new Email("owner@example.com"), [
      "123456782",
      "123456790",
    ]);

    const rows = await db.select().from(ownership);
    expect(rows).toHaveLength(2);
  });
});
