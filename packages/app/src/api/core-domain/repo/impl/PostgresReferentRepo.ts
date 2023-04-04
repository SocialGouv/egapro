import type { ReferentRaw } from "@api/core-domain/infra/db/raw";
import { sql } from "@api/shared-domain/infra/db/postgres";
import type { Referent } from "@common/core-domain/domain/Referent";
import { referentMap } from "@common/core-domain/mappers/referentMap";
import { UnexpectedRepositoryError } from "@common/shared-domain";
import { UniqueID } from "@common/shared-domain/domain/valueObjects";
import type { Any } from "@common/utils/types";

import type { IReferentRepo } from "../IReferentRepo";

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
    await sql`truncate table ${this.table}`;
  }

  public async delete(id: UniqueID): Promise<void> {
    await this.sql`delete from ${this.table} where id = ${id.getValue()}`;
  }

  public async exists(id: UniqueID): Promise<boolean> {
    return !!(await this.getOne(id));
  }

  public async getOne(id: UniqueID): Promise<Referent | null> {
    const [raw] = await this.sql`select * from ${this.table} where id = ${id.getValue()} limit 1`;

    if (!raw) return null;
    return referentMap.toDomain(raw);
  }

  public async save(item: Referent): Promise<UniqueID> {
    const raw = referentMap.toPersistence(item);

    if (raw.id === "") {
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
    const [rawReturn] = await this.sql`insert into ${this.table} ${sql(
      raw,
    )} on conflict (id) do update set ${update} returning *`;
    return new UniqueID(rawReturn.id);
  }

  public async update(item: Referent): Promise<void> {
    await this.save(item);
  }

  // --- bulk

  public async getMultiple(...ids: UniqueID[]): Promise<Referent[]> {
    const raws = await this.sql`select * from ${this.table} where id in ${sql(ids.map(id => id.getValue()))}`;

    return raws.map(referentMap.toDomain);
  }

  public async saveBulk(...items: Referent[]): Promise<UniqueID[]> {
    const raws = items.map(item => {
      const raw = referentMap.toPersistence(item);
      delete (raw as Any).id;
      return raw;
    });

    const rawReturn = await this.sql`insert into ${this.table} ${sql(raws)} returning *`;

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
