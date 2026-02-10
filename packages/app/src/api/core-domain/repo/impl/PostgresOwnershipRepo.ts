import { type OwnershipRaw } from "@api/core-domain/infra/db/raw";
import { db } from "@api/shared-domain/infra/db/drizzle";
import { ownership } from "@api/shared-domain/infra/db/schema";
import {
  type Ownership,
  type OwnershipPK,
} from "@common/core-domain/domain/Ownership";
import { type Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { ownershipMap } from "@common/core-domain/mappers/ownershipMap";
import { UnexpectedRepositoryError } from "@common/shared-domain";
import { type Email } from "@common/shared-domain/domain/valueObjects";
import { and, eq, inArray, sql } from "drizzle-orm";

import { type IAuditRepo } from "../IAuditRepo";
import { type IOwnershipRepo } from "../IOwnershipRepo";
import { PostgresAuditRepo } from "./PostgresAuditRepo";

export class PostgresOwnershipRepo implements IOwnershipRepo {
  constructor(
    private drizzle: typeof db = db,
    private audit: IAuditRepo = new PostgresAuditRepo(drizzle),
  ) {}

  private isConnRefused(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: unknown }).code === "ECONNREFUSED"
    );
  }

  public async getAllEmailsBySiren(
    siren: Siren,
    username?: string,
  ): Promise<string[]> {
    try {
      const sirenValue = siren.getValue();

      const raws = await this.drizzle
        .select({ siren: ownership.siren, email: ownership.email })
        .from(ownership)
        .where(eq(ownership.siren, sirenValue));

      this.audit.logQuery(
        "PostgresOwnershipRepo.getAllEmailsBySiren",
        "ownership",
        `select * from ownership where siren=$1`,
        [sirenValue],
        raws.length,
        username,
      );

      return raws.map((owner) => owner.email);
    } catch (error: unknown) {
      console.error(error);
      // TODO better error handling
      if (this.isConnRefused(error)) {
        throw new UnexpectedRepositoryError(
          "Database unreachable. Please verify connection.",
          error as Error,
        );
      }
      throw error;
    }
  }

  public async getAllSirenByEmail(
    email: Email,
    username?: string,
  ): Promise<string[]> {
    try {
      const emailValue = email.getValue();

      const raws = await this.drizzle
        .select({ siren: ownership.siren, email: ownership.email })
        .from(ownership)
        .where(eq(ownership.email, emailValue));

      this.audit.logQuery(
        "PostgresOwnershipRepo.getAllSirenByEmail",
        "ownership",
        `select * from ownership where email=$1`,
        [emailValue],
        raws.length,
        username,
      );

      return raws.map((owner) => owner.siren);
    } catch (error: unknown) {
      console.error(error);
      // TODO better error handling
      if (this.isConnRefused(error)) {
        throw new UnexpectedRepositoryError(
          "Database unreachable. Please verify connection.",
          error as Error,
        );
      }
      throw error;
    }
  }

  public async addSirens(
    email: Email,
    sirensToAdd: string[],
    username?: string,
  ): Promise<void> {
    try {
      const emailValue = email.getValue();
      const values = sirensToAdd.map((siren) => ({ siren, email: emailValue }));

      await this.drizzle.insert(ownership).values(values).onConflictDoNothing();

      this.audit.logQuery(
        "PostgresOwnershipRepo.addSirens",
        "ownership",
        `INSERT INTO ownership VALUES (${sirensToAdd
          .map((siren) => `('${siren}', '${emailValue}')`)
          .join(", ")}) ON CONFLICT DO NOTHING`,
        [emailValue, sirensToAdd],
        undefined,
        username,
      );
    } catch (error: unknown) {
      console.error(error);
      throw error;
    }
  }

  public async removeSirens(
    email: Email,
    sirensToRemove: string[],
    username?: string,
  ): Promise<void> {
    try {
      const emailValue = email.getValue();

      await this.drizzle
        .delete(ownership)
        .where(
          and(
            eq(ownership.email, emailValue),
            inArray(ownership.siren, sirensToRemove),
          ),
        );

      this.audit.logQuery(
        "PostgresOwnershipRepo.removeSirens",
        "ownership",
        `DELETE FROM ownership WHERE email = $1 AND siren = ANY($2)`,
        [emailValue, sirensToRemove],
        undefined,
        username,
      );
    } catch (error: unknown) {
      console.error(error);
      throw error;
    }
  }

  public async getAll(username?: string): Promise<Ownership[]> {
    try {
      const raws = await this.drizzle
        .select({ siren: ownership.siren, email: ownership.email })
        .from(ownership);

      this.audit.logQuery(
        "PostgresOwnershipRepo.getAll",
        "ownership",
        `select * from ownership`,
        [],
        raws.length,
        username,
      );

      return raws.map(ownershipMap.toDomain);
    } catch (error: unknown) {
      console.error(error);
      // TODO better error handling
      if (this.isConnRefused(error)) {
        throw new UnexpectedRepositoryError(
          "Database unreachable. Please verify connection.",
          error as Error,
        );
      }
      throw error;
    }
  }

  public deleteBulk(..._ids: OwnershipPK[]): Promise<void> {
    throw new Error("Method not implemented.");
  }

  // TODO use before creating new ownership request
  public async existsMultiple(...ids: OwnershipPK[]): Promise<boolean[]> {
    type ExistsRow = { exists: boolean };

    const valuesTuples = ids.map(
      ([siren, email]) => sql`(${siren.getValue()}, ${email.getValue()})`,
    );

    const raws = await this.drizzle.execute<ExistsRow>(sql`
      select siren, email, exists (
        select 1
        from ${ownership}
        where ${ownership}.siren = exists_data.siren
          and ${ownership}.email = exists_data.email
      ) as exists
      from (values ${sql.join(valuesTuples, sql`, `)}) as exists_data (siren, email)
    `);

    return raws.map((raw) => raw.exists);
  }

  public getMultiple(..._ids: OwnershipPK[]): Promise<Ownership[]> {
    throw new Error("Method not implemented.");
  }

  public async saveBulk(...items: Ownership[]): Promise<OwnershipPK[]> {
    const raws = items.map(ownershipMap.toPersistence);

    await this.drizzle.insert(ownership).values(raws).onConflictDoNothing();

    this.audit.logQuery(
      "PostgresOwnershipRepo.saveBulk",
      "ownership",
      `INSERT INTO ownership VALUES ${items
        .map(
          (item) => `('${item.siren.getValue()}', '${item.email.getValue()}')`,
        )
        .join(", ")} ON CONFLICT DO NOTHING`,
      items.map((item) => ({
        siren: item.siren.getValue(),
        email: item.email.getValue(),
      })),
      undefined,
      undefined,
    );

    return items.map((item) => [item.siren, item.email]);
  }

  public updateBulk(..._items: Ownership[]): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public delete(_id: OwnershipPK): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public exists(_id: OwnershipPK): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  public getOne(_id: OwnershipPK): Promise<Ownership | null> {
    throw new Error("Method not implemented.");
  }

  public async save(item: Ownership): Promise<OwnershipPK> {
    const raw = ownershipMap.toPersistence(item);
    const sirenValue = item.siren.getValue();
    const emailValue = item.email.getValue();

    await this.drizzle.insert(ownership).values(raw).onConflictDoNothing();

    this.audit.logQuery(
      "PostgresOwnershipRepo.save",
      "ownership",
      `INSERT INTO ownership VALUES ('${sirenValue}', '${emailValue}') ON CONFLICT DO NOTHING`,
      [sirenValue, emailValue],
      undefined,
      undefined,
    );

    return [item.siren, item.email];
  }

  public update(_item: Ownership): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
