import { type DeclarationRaw } from "@api/core-domain/infra/db/DeclarationRaw";
import { db } from "@api/shared-domain/infra/db/drizzle";
import { declaration, ownership } from "@api/shared-domain/infra/db/schema";
import {
  type Declaration,
  type DeclarationPK,
} from "@common/core-domain/domain/Declaration";
import { type DeclarationOpmc } from "@common/core-domain/domain/DeclarationOpmc";
import { type Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { declarationMap } from "@common/core-domain/mappers/declarationMap";
import { declarationOpmcMap } from "@common/core-domain/mappers/declarationOpmcMap";
import {
  type SQLCount,
  UnexpectedRepositoryError,
} from "@common/shared-domain";
import { type Email } from "@common/shared-domain/domain/valueObjects";
import { type Any } from "@common/utils/types";
import { and, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";

import { type IDeclarationRepo } from "../IDeclarationRepo";
import { PostgresDeclarationSearchRepo } from "./PostgresDeclarationSearchRepo";

export class PostgresDeclarationRepo implements IDeclarationRepo {
  constructor(private drizzle: typeof db = db) {}

  public async getOneDeclarationOpmc([
    siren,
    year,
  ]: DeclarationPK): Promise<DeclarationOpmc | null> {
    try {
      const [raw] = (await this.drizzle
        .select()
        .from(declaration)
        .where(
          and(
            eq(declaration.siren, siren.getValue()),
            eq(declaration.year, year.getValue()),
          ),
        )
        .limit(1)) as unknown as DeclarationRaw[];

      if (!raw) return null;
      return declarationOpmcMap.toDomain(raw);
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

  public async saveDeclarationOpmcWithIndex(
    item: DeclarationOpmc,
  ): Promise<void> {
    await this.drizzle.transaction(async (transac) => {
      const thisRepo = new PostgresDeclarationRepo(
        transac as unknown as typeof db,
      );
      const searchRepo = new PostgresDeclarationSearchRepo(
        transac as unknown as typeof db,
      );
      await thisRepo.saveDeclarationOpmc(item);
      await searchRepo.index(item.declaration);
    });
  }

  /** Prefer use saveDeclarationOpmcWithIndex if you want to synchronize the search */
  private async saveDeclarationOpmc(
    item: DeclarationOpmc,
  ): Promise<DeclarationPK> {
    const raw = declarationOpmcMap.toPersistence(item);

    const values: Any = {
      ...raw,
      ft: sql`to_tsvector('ftdict', ${raw.ft})`,
    };

    await this.drizzle
      .insert(declaration)
      .values(values)
      .onConflictDoUpdate({
        target: [declaration.siren, declaration.year],
        set: {
          data: values.data,
          modified_at: values.modified_at,
          declarant: values.declarant,
          ft: values.ft,
        },
      });

    return [item.declaration.siren, item.declaration.year];
  }

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

  public async getAllByEmail(emails: Email | Email[]): Promise<Declaration[]> {
    try {
      const emailArray = Array.isArray(emails) ? emails : [emails];
      const emailStrings = emailArray.map((email) => email.getValue());
      const limit = this.requestLimit;

      let q: Any = this.drizzle
        .select({
          siren: declaration.siren,
          year: declaration.year,
          modified_at: declaration.modified_at,
          declared_at: declaration.declared_at,
          declarant: declaration.declarant,
          data: declaration.data,
          draft: declaration.draft,
          legacy: declaration.legacy,
          ft: declaration.ft,
        })
        .from(declaration)
        .innerJoin(ownership, eq(ownership.siren, declaration.siren))
        .where(
          and(
            inArray(ownership.email, emailStrings),
            isNotNull(declaration.data),
          ),
        )
        .orderBy(desc(declaration.year));

      if (limit > 0) q = q.limit(limit);

      const raws = (await q) as unknown as DeclarationRaw[];
      return raws.map(declarationMap.toDomain);
    } catch (error: unknown) {
      console.error(error);
      if ((error as Any).code === "ECONNREFUSED") {
        throw new UnexpectedRepositoryError(
          "Database unreachable. Please verify connection.",
          error as Error,
        );
      }
      throw error;
    }
  }

  public async getAllBySiren(siren: Siren): Promise<Declaration[]> {
    try {
      const limit = this.requestLimit;
      let q: Any = this.drizzle
        .select()
        .from(declaration)
        .where(
          and(
            eq(declaration.siren, siren.getValue()),
            isNotNull(declaration.data),
          ),
        );

      if (limit > 0) q = q.limit(limit);

      const raws = (await q) as unknown as DeclarationRaw[];
      return raws.map(declarationMap.toDomain);
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

  public async delete([siren, year]: DeclarationPK): Promise<void> {
    await this.drizzle
      .delete(declaration)
      .where(
        and(
          eq(declaration.siren, siren.getValue()),
          eq(declaration.year, year.getValue()),
        ),
      );
  }

  public exists(_id: DeclarationPK): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  public async getAll(): Promise<Declaration[]> {
    const limit = this.requestLimit;
    const query = this.drizzle.select().from(declaration);
    const raws = (limit > 0
      ? await query.limit(limit)
      : await query) as unknown as DeclarationRaw[];
    return raws.map(declarationMap.toDomain);
  }

  public async getAllSirenAndYear(): Promise<Array<Partial<DeclarationRaw>>> {
    const limit = this.requestLimit;
    let q: Any = this.drizzle
      .select({ siren: declaration.siren, year: declaration.year })
      .from(declaration)
      .where(isNotNull(declaration.data));
    if (limit > 0) q = q.limit(limit);
    return (await q) as unknown as Array<Partial<DeclarationRaw>>;
  }

  public async getOne([
    siren,
    year,
  ]: DeclarationPK): Promise<Declaration | null> {
    try {
      const [raw] = (await this.drizzle
        .select()
        .from(declaration)
        .where(
          and(
            eq(declaration.siren, siren.getValue()),
            eq(declaration.year, year.getValue()),
          ),
        )
        .limit(1)) as unknown as DeclarationRaw[];

      if (!raw) return null;
      return declarationMap.toDomain(raw);
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

  public async saveWithIndex(item: Declaration): Promise<void> {
    await this.drizzle.transaction(async (transac) => {
      const thisRepo = new PostgresDeclarationRepo(
        transac as unknown as typeof db,
      );
      const searchRepo = new PostgresDeclarationSearchRepo(
        transac as unknown as typeof db,
      );
      await thisRepo.save(item);
      await searchRepo.index(item);
    });
  }

  /** Prefer use saveWithIndex if you want to synchronize the search */
  public async save(item: Declaration): Promise<DeclarationPK> {
    const raw = declarationMap.toPersistence(item);

    const values: Any = {
      ...raw,
      ft: sql`to_tsvector('ftdict', ${raw.ft})`,
    };

    await this.drizzle
      .insert(declaration)
      .values(values)
      .onConflictDoUpdate({
        target: [declaration.siren, declaration.year],
        set: {
          data: values.data,
          modified_at: values.modified_at,
          declarant: values.declarant,
          ft: values.ft,
        },
      });

    return [item.siren, item.year];
  }

  public async update(item: Declaration): Promise<void> {
    await this.save(item);
  }

  public async count(): Promise<number> {
    const res = (await this.drizzle.execute(
      sql`select count(*) as count from ${declaration}`,
    )) as unknown as SQLCount;
    const [{ count }] = res;
    return Number(count);
  }
}
