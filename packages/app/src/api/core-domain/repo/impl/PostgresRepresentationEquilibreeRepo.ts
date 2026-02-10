import { type RepresentationEquilibreeRaw } from "@api/core-domain/infra/db/raw";
import { db } from "@api/shared-domain/infra/db/drizzle";
import { representationEquilibree } from "@api/shared-domain/infra/db/schema";
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
import { and, eq, sql } from "drizzle-orm";

import { type IRepresentationEquilibreeRepo } from "../IRepresentationEquilibreeRepo";
import { PostgresRepresentationEquilibreeSearchRepo } from "./PostgresRepresentationEquilibreeSearchRepo";

export class PostgresRepresentationEquilibreeRepo implements IRepresentationEquilibreeRepo {
  constructor(private drizzle: typeof db = db) {}

  private nextRequestLimit = 0;
  public limit(limit = 10) {
    this.nextRequestLimit = limit;
    return this;
  }

  private get requestLimit() {
    const ret = this.nextRequestLimit ?? 0;
    this.nextRequestLimit = 0;
    return ret;
  }

  public async getAllBySiren(
    siren: Siren,
  ): Promise<RepresentationEquilibree[]> {
    try {
      const limit = this.requestLimit;
      let q: Any = this.drizzle
        .select()
        .from(representationEquilibree)
        .where(eq(representationEquilibree.siren, siren.getValue()));
      if (limit > 0) q = q.limit(limit);
      const raws = (await q) as unknown as RepresentationEquilibreeRaw[];
      return raws.map(representationEquilibreeMap.toDomain);
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
    await this.drizzle
      .delete(representationEquilibree)
      .where(
        and(
          eq(representationEquilibree.siren, siren.getValue()),
          eq(representationEquilibree.year, year.getValue()),
        ),
      );
  }

  public exists(_id: RepresentationEquilibreePK): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  public async getAll(): Promise<RepresentationEquilibree[]> {
    const limit = this.requestLimit;
    const query = this.drizzle.select().from(representationEquilibree);
    const raws = (limit > 0
      ? await query.limit(limit)
      : await query) as unknown as RepresentationEquilibreeRaw[];
    return raws.map(
      representationEquilibreeMap.toDomain,
    ) as unknown as RepresentationEquilibree[];
  }

  public async getOne([
    siren,
    year,
  ]: RepresentationEquilibreePK): Promise<RepresentationEquilibree | null> {
    try {
      const [raw] = (await this.drizzle
        .select()
        .from(representationEquilibree)
        .where(
          and(
            eq(representationEquilibree.siren, siren.getValue()),
            eq(representationEquilibree.year, year.getValue()),
          ),
        )
        .limit(1)) as unknown as RepresentationEquilibreeRaw[];

      if (!raw) return null;
      return representationEquilibreeMap.toDomain(raw);
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
    await this.drizzle.transaction(async (transac) => {
      const thisRepo = new PostgresRepresentationEquilibreeRepo(
        transac as unknown as typeof db,
      );
      const searchRepo = new PostgresRepresentationEquilibreeSearchRepo(
        transac as unknown as typeof db,
      );
      await thisRepo.save(item);
      await searchRepo.index(item);
    });
  }

  public async save(
    item: RepresentationEquilibree,
  ): Promise<RepresentationEquilibreePK> {
    const raw = representationEquilibreeMap.toPersistence(item);

    const values: Any = {
      ...raw,
      ft: sql`to_tsvector('ftdict', ${raw.ft})`,
    };

    await this.drizzle
      .insert(representationEquilibree)
      .values(values)
      .onConflictDoUpdate({
        target: [representationEquilibree.siren, representationEquilibree.year],
        set: {
          data: values.data,
          modified_at: values.modified_at,
          ft: values.ft,
        },
      });

    return [item.siren, item.year];
  }

  public async update(item: RepresentationEquilibree): Promise<void> {
    await this.save(item);
  }

  public async count(): Promise<number> {
    const res = (await this.drizzle.execute(
      sql`select count(*) as count from ${representationEquilibree}`,
    )) as unknown as SQLCount;
    const [{ count }] = res;
    return Number(count);
  }
}
