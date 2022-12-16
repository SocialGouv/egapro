import type { OwnershipRaw } from "@api/core-domain/infra/db/raw";
import { sql } from "@api/shared-domain/infra/db/postgres";
import type { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { UnexpectedRepositoryError } from "@common/shared-domain";
import type { Any } from "@common/utils/types";

import type { IOwnershipRepo } from "../IOwnershipRepo";

export class PostgresOwnershipRepo implements IOwnershipRepo {
  private sql = sql<OwnershipRaw[]>;
  private table = sql("ownership");

  public async getEmailsAllBySiren(siren: Siren): Promise<string[]> {
    try {
      const [...raw] = await this.sql`select * from ${this.table} where siren=${siren.getValue()}`;

      return raw.map(owner => owner.email);
    } catch (error: unknown) {
      console.error(error);
      // TODO better error handling
      if ((error as Any).code === "ECONNREFUSED") {
        throw new UnexpectedRepositoryError("Database unreachable. Please verify connection.", error as Error);
      }
      throw error;
    }
  }

  public async getAll(): Promise<OwnershipRaw[]> {
    try {
      return await this.sql`select * from ${this.table}`;
    } catch (error: unknown) {
      console.error(error);
      // TODO better error handling
      if ((error as Any).code === "ECONNREFUSED") {
        throw new UnexpectedRepositoryError("Database unreachable. Please verify connection.", error as Error);
      }
      throw error;
    }
  }
}
