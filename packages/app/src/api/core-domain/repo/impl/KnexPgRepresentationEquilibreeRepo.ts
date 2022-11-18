import { getDatabase } from "@api/core-domain/infra/db/knex";
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

export class KnexPgRepresentationEquilibreeRepo implements IRepresentationEquilibreeRepo {
  private db = getDatabase()("representation_equilibree");

  private nextRequestLimit = 0;
  public limit(limit = 10) {
    this.nextRequestLimit = limit;
    return this;
  }

  public getAllByPK(pk: RepresentationEquilibreePK): Promise<RepresentationEquilibree[]> {
    throw new Error("Method not implemented.");
  }

  public async getAllBySiren(siren: Siren): Promise<RepresentationEquilibree[]> {
    try {
      const raw = await this.db.select("*").where("siren", siren.getValue()).limit(this.requestLimit);

      return raw.map(reprensentationEquilibreeMap.toDomain);
    } catch (error: unknown) {
      console.error(error);
      if ((error as Any).code === "ECONNREFUSED") {
        throw new UnexpectedRepositoryError("Database unreachable. Please verify connection.", error as Error);
      }
      throw error;
    }
  }

  public delete(item: RepresentationEquilibree): Promise<void> {
    throw new Error("Method not implemented.");
  }
  public exists([siren, year]: RepresentationEquilibreePK): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  public async getAll(): Promise<RepresentationEquilibree[]> {
    const raw = await this.db.select("*");

    return raw.map(reprensentationEquilibreeMap.toDomain);
  }
  public async getOne([siren, year]: RepresentationEquilibreePK): Promise<RepresentationEquilibree | null> {
    try {
      const raw = await this.db.first("*").where("siren", siren.getValue()).andWhere("year", year.getValue());

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
    const raw = reprensentationEquilibreeMap.toPersistence(item);
    await this.db.insert(raw);
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
