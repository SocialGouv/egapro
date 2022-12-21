import type { OwnershipRaw } from "@api/core-domain/infra/db/raw";
import { sql as _sql } from "@api/shared-domain/infra/db/postgres";
import type { Ownership, OwnershipPK } from "@common/core-domain/domain/Ownership";
import type { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { ownershipMap } from "@common/core-domain/mappers/ownershipMap";
import { UnexpectedRepositoryError } from "@common/shared-domain";
import type { Any } from "@common/utils/types";

import type { IOwnershipRepo } from "../IOwnershipRepo";

export class PostgresOwnershipRepo implements IOwnershipRepo {
  private table = _sql("ownership");

  constructor(private sql = _sql<OwnershipRaw[]>) {}

  public async getEmailsAllBySiren(siren: Siren): Promise<string[]> {
    try {
      const raws = await this.sql`select * from ${this.table} where siren=${siren.getValue()}`;

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

  public async getAll(): Promise<Ownership[]> {
    try {
      const raws = await this.sql`select * from ${this.table}`;

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

  public deleteBulk(...items: Ownership[]): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public existsMultiple(...ids: OwnershipPK[]): Promise<boolean[]> {
    throw new Error("Method not implemented.");
  }

  public getMultiple(...ids: OwnershipPK[]): Promise<Ownership[]> {
    throw new Error("Method not implemented.");
  }

  public async saveBulk(...items: Ownership[]): Promise<void> {
    const raws = items.map(ownershipMap.toPersistence);

    await this.sql`insert into ${this.table} ${_sql(raws)}`;
  }

  public updateBulk(...items: Ownership[]): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public delete(item: Ownership): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public exists(id: OwnershipPK): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  public getOne(id: OwnershipPK): Promise<Ownership | null> {
    throw new Error("Method not implemented.");
  }

  public async save(item: Ownership): Promise<void> {
    const raw = ownershipMap.toPersistence(item);

    await this.sql`insert into ${this.table} ${_sql(raw)}`;
  }

  public update(item: Ownership): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
