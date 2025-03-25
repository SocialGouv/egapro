import { type ReferentRaw } from "@api/core-domain/infra/db/raw";
import { auditRepo } from "@api/core-domain/repo";
import { sql } from "@api/shared-domain/infra/db/postgres";
import { type Referent } from "@common/core-domain/domain/Referent";
import { type County } from "@common/core-domain/domain/valueObjects/County";
import { type Region } from "@common/core-domain/domain/valueObjects/Region";
import { referentMap } from "@common/core-domain/mappers/referentMap";
import { UnexpectedRepositoryError } from "@common/shared-domain";
import { UniqueID } from "@common/shared-domain/domain/valueObjects";
import { type Any } from "@common/utils/types";

import { type IReferentRepo } from "../IReferentRepo";

export class PostgresReferentRepo implements IReferentRepo {
  private sql = sql<ReferentRaw[]>;
  private table = sql("referent");

  public async getAll(): Promise<Referent[]> {
    try {
      const raws = await this.sql`select * from ${this.table}`;

      return raws.map(referentMap.toDomain);
    } catch (error: unknown) {
      console.error(error);
      // TODO better error handling
      if ((error as Any).code === "ECONNREFUSED") {
        throw new UnexpectedRepositoryError("Database unreachable. Please verify connection.", error as Error);
      }
      throw error;
    }
  }

  public async truncate(): Promise<void> {
    // Exécuter la requête
    await sql`truncate table ${this.table}`;

    // Log the DELETE query to the audit table
    auditRepo.logQuery(
      "DELETE",
      "referent",
      `TRUNCATE TABLE referent`,
      [],
      undefined,
      undefined, // Will be filled by the calling context if available
    );
  }

  public async delete(id: UniqueID): Promise<void> {
    // Paramètres de la requête
    const idValue = id.getValue();

    // Exécuter la requête
    await this.sql`delete from ${this.table} where id = ${idValue}`;

    // Log the DELETE query to the audit table
    auditRepo.logQuery(
      "DELETE",
      "referent",
      `DELETE FROM referent WHERE id = $1`,
      [idValue],
      undefined,
      undefined, // Will be filled by the calling context if available
    );
  }

  public async exists(id: UniqueID): Promise<boolean> {
    return !!(await this.getOne(id));
  }

  public async getOne(id: UniqueID): Promise<Referent | null> {
    const [raw] = await this.sql`select * from ${this.table} where id = ${id.getValue()} limit 1`;

    if (!raw) return null;
    return referentMap.toDomain(raw);
  }

  public async getOneByRegion(region?: Region): Promise<Referent | null> {
    if (!region) return null;
    const [raw] = await this.sql`select * from ${this.table} where region = ${region.getValue()} limit 1`;

    if (!raw) return null;
    return referentMap.toDomain(raw);
  }

  public async getOneByCounty(county?: County): Promise<Referent | null> {
    if (!county) return null;
    const [raw] = await this.sql`select * from ${this.table} where county = ${county.getValue()} limit 1`;

    if (!raw) return null;
    return referentMap.toDomain(raw);
  }

  public async save(item: Referent): Promise<UniqueID> {
    // Paramètres de la requête
    const raw = referentMap.toPersistence(item);
    const isInsert = raw.id === "";

    if (isInsert) {
      delete (raw as Any).id;
    }

    const update = sql(
      raw,
      "county",
      "name",
      "principal",
      "region",
      "substitute_email",
      "substitute_name",
      "type",
      "value",
    );

    // Exécuter la requête
    const [rawReturn] = await this.sql`insert into ${this.table} ${sql(
      raw,
    )} on conflict (id) do update set ${update} returning *`;

    // Log the INSERT or UPDATE query to the audit table
    if (isInsert) {
      auditRepo.logQuery(
        "INSERT",
        "referent",
        `INSERT INTO referent (county, name, principal, region, substitute_email, substitute_name, type, value) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          raw.county,
          raw.name,
          raw.principal,
          raw.region,
          raw.substitute_email,
          raw.substitute_name,
          raw.type,
          raw.value,
        ],
        undefined,
        undefined, // Will be filled by the calling context if available
      );
    } else {
      auditRepo.logQuery(
        "UPDATE",
        "referent",
        `UPDATE referent SET county = $1, name = $2, principal = $3, region = $4, 
         substitute_email = $5, substitute_name = $6, type = $7, value = $8 WHERE id = $9`,
        [
          raw.county,
          raw.name,
          raw.principal,
          raw.region,
          raw.substitute_email,
          raw.substitute_name,
          raw.type,
          raw.value,
          item.id?.getValue() || "",
        ],
        undefined,
        undefined, // Will be filled by the calling context if available
      );
    }

    return new UniqueID(rawReturn.id);
  }

  public async update(item: Referent): Promise<void> {
    // Utilise la méthode save qui gère déjà l'audit
    await this.save(item);
  }

  // --- bulk

  public async getMultiple(...ids: UniqueID[]): Promise<Referent[]> {
    const raws = await this.sql`select * from ${this.table} where id in ${sql(ids.map(id => id.getValue()))}`;

    return raws.map(referentMap.toDomain);
  }

  public async saveBulk(...items: Referent[]): Promise<UniqueID[]> {
    // Paramètres de la requête
    const raws = items.map(item => {
      const raw = referentMap.toPersistence(item);
      delete (raw as Any).id;
      return raw;
    });

    // Exécuter la requête
    const rawReturn = await this.sql`insert into ${this.table} ${sql(raws)} returning *`;

    // Log the INSERT query to the audit table
    auditRepo.logQuery(
      "INSERT",
      "referent",
      `INSERT INTO referent (county, name, principal, region, substitute_email, substitute_name, type, value) 
       VALUES ${items
         .map(
           (_, idx) =>
             `($${idx * 8 + 1}, $${idx * 8 + 2}, $${idx * 8 + 3}, $${idx * 8 + 4}, $${idx * 8 + 5}, $${idx * 8 + 6}, $${
               idx * 8 + 7
             }, $${idx * 8 + 8})`,
         )
         .join(", ")}`,
      raws.flatMap(raw => [
        raw.county,
        raw.name,
        raw.principal,
        raw.region,
        raw.substitute_email,
        raw.substitute_name,
        raw.type,
        raw.value,
      ]),
      undefined,
      undefined, // Will be filled by the calling context if available
    );

    return rawReturn.map(item => new UniqueID(item.id));
  }

  public deleteBulk(..._ids: UniqueID[]): Promise<void> {
    throw new Error("Method not implemented.");
  }
  public existsMultiple(..._ids: UniqueID[]): Promise<boolean[]> {
    throw new Error("Method not implemented.");
  }
  public updateBulk(..._items: Referent[]): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
