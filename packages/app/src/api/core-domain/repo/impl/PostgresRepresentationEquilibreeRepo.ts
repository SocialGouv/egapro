import { type RepresentationEquilibreeRaw } from "@api/core-domain/infra/db/raw";
import { sql } from "@api/shared-domain/infra/db/postgres";
import {
  type RepresentationEquilibree,
  type RepresentationEquilibreePK,
} from "@common/core-domain/domain/RepresentationEquilibree";
import { type Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { representationEquilibreeMap } from "@common/core-domain/mappers/representationEquilibreeMap";
import {
  type SQLCount,
  UnexpectedRepositoryError,
} from "@common/shared-domain";
import { type Any } from "@common/utils/types";

import { type IRepresentationEquilibreeRepo } from "../IRepresentationEquilibreeRepo";
import { PostgresRepresentationEquilibreeSearchRepo } from "./PostgresRepresentationEquilibreeSearchRepo";
import prisma from "../../../../lib/prisma";

export class PostgresRepresentationEquilibreeRepo implements IRepresentationEquilibreeRepo {
  private table = sql("representation_equilibree");
  private sql = sql<RepresentationEquilibreeRaw[]>;

  constructor(sqlInstance?: typeof sql) {
    if (sqlInstance) {
      this.sql = sqlInstance;
    }
  }

  private nextRequestLimit = 0;
  public limit(limit = 10) {
    this.nextRequestLimit = limit;
    return this;
  }

  public async getAllBySiren(
    siren: Siren,
  ): Promise<RepresentationEquilibree[]> {
    try {
      const raws = await prisma.representation_equilibree.findMany({
        where: { siren: siren.getValue() },
        take: this.requestLimit || undefined,
      });

      return raws.map((r) =>
        representationEquilibreeMap.toDomain(
          r as unknown as RepresentationEquilibreeRaw,
        ),
      );
    } catch (error: unknown) {
      console.error(error);
      // TODO better error handling
      if ((error as Any).code === "ECONNREFUSED") {
        throw new UnexpectedRepositoryError(
          "Database unreachable. Please verify connection.",
          error as Error,
        );
      }
      throw error;
    }
  }

  public async delete([
    siren,
    year,
  ]: RepresentationEquilibreePK): Promise<void> {
    await prisma.representation_equilibree.deleteMany({
      where: { siren: siren.getValue(), year: year.getValue() },
    });
  }
  public exists(_id: RepresentationEquilibreePK): Promise<boolean> {
    throw new Error("Method not implemented.");
  }
  public async getAll(): Promise<RepresentationEquilibree[]> {
    const raws = await prisma.representation_equilibree.findMany({
      take: this.requestLimit || undefined,
    });

    return raws.map((r) =>
      representationEquilibreeMap.toDomain(
        r as unknown as RepresentationEquilibreeRaw,
      ),
    ) as unknown as RepresentationEquilibree[];
  }
  public async getOne([
    siren,
    year,
  ]: RepresentationEquilibreePK): Promise<RepresentationEquilibree | null> {
    try {
      const raw = await prisma.representation_equilibree.findUnique({
        where: {
          siren_year: { siren: siren.getValue(), year: year.getValue() },
        } as any,
      });
      if (!raw) return null;
      return representationEquilibreeMap.toDomain(
        raw as unknown as RepresentationEquilibreeRaw,
      );
    } catch (error: unknown) {
      console.error(error);
      // TODO better error handling
      if ((error as Any).code === "ECONNREFUSED") {
        throw new UnexpectedRepositoryError(
          "Database unreachable. Please verify connection.",
          error as Error,
        );
      }
      throw error;
    }
  }

  public async saveWithIndex(item: RepresentationEquilibree): Promise<void> {
    // Note: original implementation used a SQL transaction for both save and indexing.
    // Here we perform save via Prisma and then call the search repo index.
    // This is not fully atomic across different client implementations; consider
    // revisiting if strict transactional atomicity is required.
    await this.save(item);
    const searchRepo = new PostgresRepresentationEquilibreeSearchRepo();
    await searchRepo.index(item);
  }

  public async save(
    item: RepresentationEquilibree,
  ): Promise<RepresentationEquilibreePK> {
    const raw = representationEquilibreeMap.toPersistence(item);
    // Use Prisma upsert for create/update
    const createData: any = {
      siren: raw.siren,
      year: raw.year,
      data: raw.data,
      modified_at: raw.modified_at ?? new Date(),
      declared_at: raw.declared_at ?? null,
    };
    const updateData: any = {
      data: raw.data,
      modified_at: raw.modified_at ?? new Date(),
      declared_at: raw.declared_at ?? null,
    };

    await prisma.representation_equilibree.upsert({
      where: { siren_year: { siren: raw.siren, year: raw.year } } as any,
      create: createData,
      update: updateData,
    });

    // Update tsvector column using raw SQL if ft data is provided
    if (raw.ft) {
      await prisma.$executeRawUnsafe(
        `UPDATE representation_equilibree SET ft = to_tsvector('ftdict', $1) WHERE siren = $2 AND year = $3`,
        raw.ft,
        raw.siren,
        raw.year,
      );
    }

    return [item.siren, item.year];
  }

  public async update(item: RepresentationEquilibree): Promise<void> {
    await this.save(item);
  }

  public async count(): Promise<number> {
    const [{ count }] = await sql<SQLCount>`select count(*) from ${this.table}`;
    return Number(count);
  }

  private get requestLimit() {
    const ret = this.nextRequestLimit ?? 0;
    this.nextRequestLimit = 0;
    return ret;
  }

  private get postgresLimit() {
    const limit = this.requestLimit;
    return limit > 0 ? sql`limit ${limit}` : sql``;
  }
}
