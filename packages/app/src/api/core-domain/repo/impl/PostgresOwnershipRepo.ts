import { type OwnershipRaw } from "@api/core-domain/infra/db/raw";
import { auditRepo } from "@api/core-domain/repo";
import { sql as _sql } from "@api/shared-domain/infra/db/postgres";
import { type Ownership, type OwnershipPK } from "@common/core-domain/domain/Ownership";
import { type Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { ownershipMap } from "@common/core-domain/mappers/ownershipMap";
import { UnexpectedRepositoryError } from "@common/shared-domain";
import { type Email } from "@common/shared-domain/domain/valueObjects";
import { type Any } from "@common/utils/types";

import { type IOwnershipRepo } from "../IOwnershipRepo";

export class PostgresOwnershipRepo implements IOwnershipRepo {
  private table = _sql("ownership");

  constructor(private sql = _sql<OwnershipRaw[]>) {}

  public async getAllEmailsBySiren(siren: Siren): Promise<string[]> {
    try {
      // Paramètres de la requête
      const sirenValue = siren.getValue();

      // Exécuter la requête
      const raws = await this.sql`select * from ${this.table} where siren=${sirenValue}`;

      // Log the SELECT query to the audit table
      await auditRepo.logQuery(
        "SELECT",
        "ownership",
        `select * from ownership where siren=$1`,
        [sirenValue],
        raws.length,
        undefined, // Will be filled by the calling context if available
      );

      return raws.map(owner => owner.email);
    } catch (error: unknown) {
      console.error(error);
      // TODO better error handling
      if ((error as Any).code === "ECONNREFUSED") {
        throw new UnexpectedRepositoryError("Database unreachable. Please verify connection.", error as Error);
      }
      throw error;
    }
  }

  public async getAllSirenByEmail(email: Email): Promise<string[]> {
    try {
      // Paramètres de la requête
      const emailValue = email.getValue();

      // Exécuter la requête
      const raws = await this.sql`select * from ${this.table} where email=${emailValue}`;

      // Log the SELECT query to the audit table
      await auditRepo.logQuery(
        "SELECT",
        "ownership",
        `select * from ownership where email=$1`,
        [emailValue],
        raws.length,
        undefined, // Will be filled by the calling context if available
      );

      return raws.map(owner => owner.siren);
    } catch (error: unknown) {
      console.error(error);
      // TODO better error handling
      if ((error as Any).code === "ECONNREFUSED") {
        throw new UnexpectedRepositoryError("Database unreachable. Please verify connection.", error as Error);
      }
      throw error;
    }
  }

  public async addSirens(email: Email, sirensToAdd: string[]): Promise<void> {
    try {
      // Paramètres de la requête
      const emailValue = email.getValue();
      const values = sirensToAdd.map(siren => ({ siren, email: emailValue }));

      // Exécuter la requête
      await this.sql`INSERT INTO ${this.table} ${_sql(values)} ON CONFLICT DO NOTHING`;

      // Log the INSERT query to the audit table
      await auditRepo.logQuery(
        "INSERT",
        "ownership",
        `INSERT INTO ownership VALUES (${sirensToAdd
          .map(siren => `('${siren}', '${emailValue}')`)
          .join(", ")}) ON CONFLICT DO NOTHING`,
        [emailValue, sirensToAdd],
        undefined,
        undefined, // Will be filled by the calling context if available
      );
    } catch (error: unknown) {
      console.error(error);
      throw error;
    }
  }

  public async removeSirens(email: Email, sirensToRemove: string[]): Promise<void> {
    try {
      // Paramètres de la requête
      const emailValue = email.getValue();

      // Exécuter la requête
      await this.sql`DELETE FROM ${this.table} WHERE email = ${emailValue} AND siren = ANY(${sirensToRemove})`;

      // Log the DELETE query to the audit table
      await auditRepo.logQuery(
        "DELETE",
        "ownership",
        `DELETE FROM ownership WHERE email = $1 AND siren = ANY($2)`,
        [emailValue, sirensToRemove],
        undefined,
        undefined, // Will be filled by the calling context if available
      );
    } catch (error: unknown) {
      console.error(error);
      throw error;
    }
  }

  public async getAll(): Promise<Ownership[]> {
    try {
      // Exécuter la requête
      const raws = await this.sql`select * from ${this.table}`;

      // Log the SELECT query to the audit table
      await auditRepo.logQuery(
        "SELECT",
        "ownership",
        `select * from ownership`,
        [],
        raws.length,
        undefined, // Will be filled by the calling context if available
      );

      return raws.map(ownershipMap.toDomain);
    } catch (error: unknown) {
      console.error(error);
      // TODO better error handling
      if ((error as Any).code === "ECONNREFUSED") {
        throw new UnexpectedRepositoryError("Database unreachable. Please verify connection.", error as Error);
      }
      throw error;
    }
  }

  public deleteBulk(..._ids: OwnershipPK[]): Promise<void> {
    throw new Error("Method not implemented.");
  }

  // TODO use before creating new ownership request
  public async existsMultiple(...ids: OwnershipPK[]): Promise<boolean[]> {
    const sql = _sql<Array<OwnershipRaw & { exists: boolean }>>;
    const values = ids.map(([siren, email]) => [siren.getValue(), email.getValue()]);

    const raws = await sql`
select siren, email, exists (
  select 1
  from ${this.table}
  where ${this.table}.siren = exists_data.siren
  and ${this.table}.email = exists_data.email
) from (values ${_sql(values)}) as exists_data (siren, email)
`;

    return raws.map(raw => raw.exists);
  }

  public getMultiple(..._ids: OwnershipPK[]): Promise<Ownership[]> {
    throw new Error("Method not implemented.");
  }

  public async saveBulk(...items: Ownership[]): Promise<OwnershipPK[]> {
    // Paramètres de la requête
    const raws = items.map(ownershipMap.toPersistence);

    // Exécuter la requête
    await this.sql`insert into ${this.table} ${_sql(raws)} on conflict do nothing returning true`;

    // Log the INSERT query to the audit table
    await auditRepo.logQuery(
      "INSERT",
      "ownership",
      `INSERT INTO ownership VALUES ${items
        .map(item => `('${item.siren.getValue()}', '${item.email.getValue()}')`)
        .join(", ")} ON CONFLICT DO NOTHING`,
      items.map(item => ({ siren: item.siren.getValue(), email: item.email.getValue() })),
      undefined,
      undefined, // Will be filled by the calling context if available
    );

    return items.map(item => [item.siren, item.email]);
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
    // Paramètres de la requête
    const raw = ownershipMap.toPersistence(item);
    const sirenValue = item.siren.getValue();
    const emailValue = item.email.getValue();

    // Exécuter la requête
    await this.sql`insert into ${this.table} ${_sql(raw)} on conflict do nothing returning true`;

    // Log the INSERT query to the audit table
    await auditRepo.logQuery(
      "INSERT",
      "ownership",
      `INSERT INTO ownership VALUES ('${sirenValue}', '${emailValue}') ON CONFLICT DO NOTHING`,
      [sirenValue, emailValue],
      undefined,
      undefined, // Will be filled by the calling context if available
    );

    return [item.siren, item.email];
  }

  public update(_item: Ownership): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
