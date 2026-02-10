import { type ReferentRaw } from "@api/core-domain/infra/db/raw";
import { db } from "@api/shared-domain/infra/db/drizzle";
import { referent } from "@api/shared-domain/infra/db/schema";
import { type Referent } from "@common/core-domain/domain/Referent";
import { type County } from "@common/core-domain/domain/valueObjects/County";
import { type Region } from "@common/core-domain/domain/valueObjects/Region";
import { referentMap } from "@common/core-domain/mappers/referentMap";
import { UnexpectedRepositoryError } from "@common/shared-domain";
import { UniqueID } from "@common/shared-domain/domain/valueObjects";
import { type Any } from "@common/utils/types";
import { and, eq, inArray, sql } from "drizzle-orm";

import { type IReferentRepo } from "../IReferentRepo";

export class PostgresReferentRepo implements IReferentRepo {
  constructor(private drizzle: typeof db = db) {}

  public async getAll(): Promise<Referent[]> {
    try {
      const raws = (await this.drizzle
        .select()
        .from(referent)) as unknown as ReferentRaw[];
      return raws.map(referentMap.toDomain);
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

  public async truncate(): Promise<void> {
    await this.drizzle.execute(sql`truncate table ${referent}`);
  }

  public async delete(id: UniqueID): Promise<void> {
    await this.drizzle.delete(referent).where(eq(referent.id, id.getValue()));
  }

  public async exists(id: UniqueID): Promise<boolean> {
    return !!(await this.getOne(id));
  }

  public async getOne(id: UniqueID): Promise<Referent | null> {
    const [raw] = (await this.drizzle
      .select()
      .from(referent)
      .where(eq(referent.id, id.getValue()))
      .limit(1)) as unknown as ReferentRaw[];
    if (!raw) return null;
    return referentMap.toDomain(raw);
  }

  public async getOneByRegion(region?: Region): Promise<Referent | null> {
    if (!region) return null;
    const [raw] = (await this.drizzle
      .select()
      .from(referent)
      .where(eq(referent.region, region.getValue()))
      .limit(1)) as unknown as ReferentRaw[];
    if (!raw) return null;
    return referentMap.toDomain(raw);
  }

  public async getOneByCounty(county?: County): Promise<Referent | null> {
    if (!county) return null;
    const [raw] = (await this.drizzle
      .select()
      .from(referent)
      .where(eq(referent.county, county.getValue()))
      .limit(1)) as unknown as ReferentRaw[];
    if (!raw) return null;
    return referentMap.toDomain(raw);
  }

  public async save(item: Referent): Promise<UniqueID> {
    const raw = referentMap.toPersistence(item);

    if (raw.id === "") {
      delete (raw as Any).id;
    }

    const [rawReturn] = (await this.drizzle
      .insert(referent)
      .values(raw)
      .onConflictDoUpdate({
        target: referent.id,
        set: {
          county: raw.county,
          name: raw.name,
          principal: raw.principal,
          region: raw.region,
          substitute_email: raw.substitute_email,
          substitute_name: raw.substitute_name,
          type: raw.type,
          value: raw.value,
        },
      })
      .returning({ id: referent.id })) as unknown as Array<{ id: string }>;

    return new UniqueID(rawReturn.id);
  }

  public async update(item: Referent): Promise<void> {
    await this.save(item);
  }

  // --- bulk

  public async getMultiple(...ids: UniqueID[]): Promise<Referent[]> {
    const raws = (await this.drizzle
      .select()
      .from(referent)
      .where(
        inArray(
          referent.id,
          ids.map((id) => id.getValue()),
        ),
      )) as unknown as ReferentRaw[];
    return raws.map(referentMap.toDomain);
  }

  public async saveBulk(...items: Referent[]): Promise<UniqueID[]> {
    const raws = items.map((item) => {
      const raw = referentMap.toPersistence(item);
      delete (raw as Any).id;
      return raw;
    });

    const rawReturn = (await this.drizzle
      .insert(referent)
      .values(raws)
      .returning({ id: referent.id })) as unknown as Array<{ id: string }>;

    return rawReturn.map((item) => new UniqueID(item.id));
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
