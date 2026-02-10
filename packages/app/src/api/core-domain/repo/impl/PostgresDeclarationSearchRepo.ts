import { type DeclarationSearchRaw } from "@api/core-domain/infra/db/DeclarationSearch";
import {
  type DeclarationSearchResultRaw,
  type DeclarationStatsRaw,
} from "@api/core-domain/infra/db/raw";
import { db } from "@api/shared-domain/infra/db/drizzle";
import { declaration, search } from "@api/shared-domain/infra/db/schema";
import { type Declaration } from "@common/core-domain/domain/Declaration";
import { type DeclarationSearchResult } from "@common/core-domain/domain/DeclarationSearchResult";
import { type DeclarationStatsDTO } from "@common/core-domain/dtos/SearchDeclarationDTO";
import { declarationSearchMap } from "@common/core-domain/mappers/declarationSearchMap";
import { declarationSearchResultMap } from "@common/core-domain/mappers/declarationSearchResultMap";
import { PUBLIC_CURRENT_YEAR, SEARCHABLE_YEARS } from "@common/dict";
import { type SQLCount } from "@common/shared-domain";
import { cleanFullTextSearch } from "@common/utils/postgres";
import { type Any } from "@common/utils/types";
import { isFinite as isFiniteNumber } from "lodash";
import { sql } from "drizzle-orm";

import {
  type DeclarationSearchCriteria,
  type DeclarationStatsCriteria,
  type IDeclarationSearchRepo,
} from "../IDeclarationSearchRepo";
import { type RepresentationEquilibreeSearchCriteria } from "../IRepresentationEquilibreeSearchRepo";

export class PostgresDeclarationSearchRepo implements IDeclarationSearchRepo {
  constructor(private drizzle: typeof db = db) {}

  public async index(item: Declaration): Promise<void> {
    const raw = declarationSearchMap.toPersistence(item);

    const values: Any = {
      ...raw,
      ft: sql`to_tsvector('ftdict', ${raw.ft})`,
    };

    await this.drizzle
      .insert(search)
      .values(values)
      .onConflictDoUpdate({
        target: [search.siren, search.year],
        set: {
          declared_at: values.declared_at,
          ft: values.ft,
          region: values.region,
          departement: values.departement,
          section_naf: values.section_naf,
        },
      });
  }

  public async stats(
    criteria: DeclarationStatsCriteria,
  ): Promise<DeclarationStatsDTO> {
    const where = this.buildStatsWhereClause(criteria);

    const [raw] = (await this.drizzle.execute(sql`
      WITH subset AS (SELECT siren FROM ${search} ${where}),
      count AS (SELECT COUNT(DISTINCT(siren))::int FROM subset),
      stats AS (SELECT avg((data->'déclaration'->>'index')::real),
                      min((data->'déclaration'->>'index')::int),
                      max((data->'déclaration'->>'index')::int)
              FROM ${declaration}
              WHERE year=${criteria.year} AND siren IN (SELECT siren FROM subset))
      SELECT * FROM count JOIN stats ON true;
    `)) as unknown as DeclarationStatsRaw[];

    return raw;
  }

  public async search(
    criteria: DeclarationSearchCriteria,
  ): Promise<DeclarationSearchResult[]> {
    const where = this.buildSearchWhereClause(criteria);

    const raws = (await this.drizzle.execute(sql`
      SELECT
        (array_agg(${declaration}.data ORDER BY ${declaration}.year DESC))[1]->'entreprise'->>'siren' as siren,
        (array_agg(${declaration}.data ORDER BY ${declaration}.year DESC))[1]->'entreprise'->>'raison_sociale' as name,
        jsonb_object_agg(${declaration}.year::text, ${declaration}.data) as data,
        jsonb_object_agg(${declaration}.year::text, json_build_object(
            'index', (${declaration}.data->'déclaration'->>'index')::int,
            'remunerationsScore', (${declaration}.data->'indicateurs'->'rémunérations'->>'note')::int,
            'salaryRaisesScore', (${declaration}.data->'indicateurs'->'augmentations'->>'note')::int,
            'promotionsScore', (${declaration}.data->'indicateurs'->'promotions'->>'note')::int,
            'salaryRaisesAndPromotionsScore', (${declaration}.data->'indicateurs'->'augmentations_et_promotions'->>'note')::int,
            'maternityLeavesScore', (${declaration}.data->'indicateurs'->'congés_maternité'->>'note')::int,
            'highRemunerationsScore', (${declaration}.data->'indicateurs'->'hautes_rémunérations'->>'note')::int,
            'notComputableReasonRemunerations', (${declaration}.data->'indicateurs'->'rémunérations'->>'non_calculable')::text,
            'notComputableReasonSalaryRaises', (${declaration}.data->'indicateurs'->'augmentations'->>'non_calculable')::text,
            'notComputableReasonPromotions', (${declaration}.data->'indicateurs'->'promotions'->>'non_calculable')::text,
            'notComputableReasonSalaryRaisesAndPromotions', (${declaration}.data->'indicateurs'->'augmentations_et_promotions'->>'non_calculable')::text,
            'notComputableReasonMaternityLeaves', (${declaration}.data->'indicateurs'->'congés_maternité'->>'non_calculable')::text
        )) as results
      FROM ${declaration}
      JOIN ${search} ON ${declaration}.siren=${search}.siren AND ${declaration}.year=${search}.year
      ${where}
      GROUP BY ${declaration}.siren
      ORDER BY max(${declaration}.year) DESC
      LIMIT ${criteria.limit ?? 10}
      OFFSET ${criteria.offset ?? 0}
    `)) as unknown as DeclarationSearchResultRaw[];

    return raws.map(declarationSearchResultMap.toDomain);
  }

  public async count(
    criteria: RepresentationEquilibreeSearchCriteria,
  ): Promise<number> {
    const where = this.buildSearchWhereClause(criteria);

    const [{ count }] = (await this.drizzle
      .select({ count: sql<string>`count(distinct(${search.siren})) as count` })
      .from(search)
      .where(where)) as unknown as SQLCount;
    return +count;
  }

  private buildSearchWhereClause(
    criteria: RepresentationEquilibreeSearchCriteria,
  ) {
    let querySql = sql``;
    if (criteria.query) {
      if (criteria.query.length === 9 && isFiniteNumber(+criteria.query)) {
        querySql = sql`and ${search}.siren=${criteria.query}`;
      } else {
        querySql = sql`and ${search}.ft @@ to_tsquery('ftdict', ${cleanFullTextSearch(criteria.query)})`;
      }
    }

    // Keep the original semantics: year IN (SEARCHABLE_YEARS)
    const years = sql.join(
      (SEARCHABLE_YEARS as unknown as number[]).map((y) => sql`${y}`),
      sql`, `,
    );
    const sqlYear = sql`${search}.year in (${years})`;
    const sqlDepartement = criteria.countyCode
      ? sql`and ${search}.departement=${criteria.countyCode}`
      : sql``;
    const sqlSectionNaf = criteria.nafSection
      ? sql`and ${search}.section_naf=${criteria.nafSection}`
      : sql``;
    const sqlRegion = criteria.regionCode
      ? sql`and ${search}.region=${criteria.regionCode}`
      : sql``;

    return sql`where ${sqlYear} ${sqlDepartement} ${sqlSectionNaf} ${sqlRegion} ${querySql}`;
  }

  private buildStatsWhereClause(criteria: DeclarationStatsCriteria) {
    const sqlYear = sql`${search}.year=${Number(criteria.year) || PUBLIC_CURRENT_YEAR}`;
    const sqlDepartement = criteria.countyCode
      ? sql`and ${search}.departement=${criteria.countyCode}`
      : sql``;
    const sqlSectionNaf = criteria.nafSection
      ? sql`and ${search}.section_naf=${criteria.nafSection}`
      : sql``;
    const sqlRegion = criteria.regionCode
      ? sql`and ${search}.region=${criteria.regionCode}`
      : sql``;

    return sql`where ${sqlYear} ${sqlDepartement} ${sqlSectionNaf} ${sqlRegion}`;
  }
}
