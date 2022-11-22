import { sql } from "@api/core-domain/infra/db/postgres";
import type { RepresentationEquilibreeRaw } from "@api/core-domain/infra/db/raw";
import type {
  RepresentationEquilibree,
  RepresentationEquilibreePK,
} from "@common/core-domain/domain/RepresentationEquilibree";
import type { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { reprensentationEquilibreeMap } from "@common/core-domain/mappers/reprensentationEquilibreeMap";
import { UnexpectedRepositoryError } from "@common/shared-domain";
import type { Any } from "@common/utils/types";
import {} from "net";

import type { IRepresentationEquilibreeRepo } from "../IRepresentationEquilibreeRepo";

export class PostgresRepresentationEquilibreeRepo implements IRepresentationEquilibreeRepo {
  private nextRequestLimit = 0;
  public limit(limit = 10) {
    this.nextRequestLimit = limit;
    return this;
  }

  public getAllByPK(pk: RepresentationEquilibreePK): Promise<RepresentationEquilibree[]> {
    throw new Error("Method not implemented.");
  }

  public async getAllBySiren(siren: Siren): Promise<RepresentationEquilibree[]> {
    throw new Error("Method not implemented.");
    // try {
    //   const raw = await this.db.select("*").where("siren", siren.getValue()).limit(this.requestLimit);

    //   return raw.map(reprensentationEquilibreeMap.toDomain);
    // } catch (error: unknown) {
    //   console.error(error);
    //   if ((error as Any).code === "ECONNREFUSED") {
    //     throw new UnexpectedRepositoryError("Database unreachable. Please verify connection.", error as Error);
    //   }
    //   throw error;
    // }
  }

  public delete(item: RepresentationEquilibree): Promise<void> {
    throw new Error("Method not implemented.");
  }
  public exists([siren, year]: RepresentationEquilibreePK): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  public async getAll(): Promise<RepresentationEquilibree[]> {
    const raw = await sql<RepresentationEquilibreeRaw[]>`select * from representation_equilibree`;

    return raw.map(reprensentationEquilibreeMap.toDomain) as unknown as RepresentationEquilibree[];
  }
  public async getOne([siren, year]: RepresentationEquilibreePK): Promise<RepresentationEquilibree | null> {
    try {
      //   const raw = await this.db.first("*").where("siren", siren.getValue()).andWhere("year", year.getValue());
      const [raw] = await sql<
        RepresentationEquilibreeRaw[]
      >`select * from representation_equilibree where siren=${siren.getValue()} and year=${year.getValue()} limit 1`;

      return reprensentationEquilibreeMap.toDomain(raw);
    } catch (error: unknown) {
      console.error(error);
      if ((error as Any).code === "ECONNREFUSED") {
        throw new UnexpectedRepositoryError("Database unreachable. Please verify connection.", error as Error);
      }
      throw error;
    }
  }
  public async save(item: RepresentationEquilibree): Promise<void> {
    // const raw = reprensentationEquilibreeMap.toPersistence(item);
    // await this.db.insert(raw);
    throw new Error("Method not implemented.");
  }
  public update(item: RepresentationEquilibree): Promise<void> {
    throw new Error("Method not implemented.");
  }

  private get requestLimit() {
    const ret = this.nextRequestLimit ?? 0;
    this.nextRequestLimit = 0;
    return ret;
  }
}
