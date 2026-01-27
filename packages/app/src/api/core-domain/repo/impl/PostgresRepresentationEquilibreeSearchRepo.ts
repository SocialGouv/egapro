import {
  type RepresentationEquilibreeSearchRaw,
  type RepresentationEquilibreeSearchResultRaw,
} from "@api/core-domain/infra/db/raw";
import { sql } from "@api/shared-domain/infra/db/postgres";
import { type RepresentationEquilibree } from "@common/core-domain/domain/RepresentationEquilibree";
import { type RepresentationEquilibreeSearchResult } from "@common/core-domain/domain/RepresentationEquilibreeSearchResult";
import { representationEquilibreeSearchMap } from "@common/core-domain/mappers/representationEquilibreeSearchMap";
import { representationEquilibreeSearchResultMap } from "@common/core-domain/mappers/representationEquilibreeSearchResultMap";
import { PUBLIC_YEARS_REPEQ } from "@common/dict";
import { type SQLCount } from "@common/shared-domain";
import { cleanFullTextSearch } from "@common/utils/postgres";
import { type Any } from "@common/utils/types";
import { isFinite } from "lodash";
import { type PostgresError } from "postgres";
import prisma from "../../../../lib/prisma";

import {
  type IRepresentationEquilibreeSearchRepo,
  type RepresentationEquilibreeSearchCriteria,
} from "../IRepresentationEquilibreeSearchRepo";

export class PostgresRepresentationEquilibreeSearchRepo implements IRepresentationEquilibreeSearchRepo {
  private repEqTable = sql("representation_equilibree");
  private table = sql("search_representation_equilibree");
  private sql = sql;
  private prisma = prisma;

  constructor(sqlInstance?: typeof sql) {
    if (sqlInstance) {
      this.sql = sqlInstance;
    }
  }

  public async index(item: RepresentationEquilibree): Promise<void> {
    const raw = representationEquilibreeSearchMap.toPersistence(item);

    const ftRaw: Any = {
      ...raw,
      ft: sql`to_tsvector('ftdict', ${raw.ft})`,
    };
    const insert = sql(ftRaw);
    const update = sql(
      ftRaw,
      "declared_at",
      "ft",
      "region",
      "departement",
      "section_naf",
    );

    await this.sql<
      RepresentationEquilibreeSearchRaw[]
    >`insert into ${this.table} ${insert} on conflict (siren, year) do update set ${update}`;
  }

  public async search(
    criteria: RepresentationEquilibreeSearchCriteria,
  ): Promise<RepresentationEquilibreeSearchResult[]> {
    const sqlWhereClause = this.buildSearchWhereClause(criteria);
    // Use prisma.$queryRaw for the complex aggregation query
    const query = `
      SELECT
        (jsonb_agg(r.data->'entreprise' ORDER BY r.year DESC) -> 0) as company,
        jsonb_object_agg(r.year::text, json_build_object(
          'executiveMenPercent', replace((r.data->'indicateurs'->'représentation_équilibrée'->>'pourcentage_hommes_cadres')::text, ',', '.')::real,
          'executiveWomenPercent', replace((r.data->'indicateurs'->'représentation_équilibrée'->>'pourcentage_femmes_cadres')::text, ',', '.')::real,
          'memberMenPercent', replace((r.data->'indicateurs'->'représentation_équilibrée'->>'pourcentage_hommes_membres')::text, ',', '.')::real,
          'memberWomenPercent', replace((r.data->'indicateurs'->'représentation_équilibrée'->>'pourcentage_femmes_membres')::text, ',', '.')::real,
          'notComputableReasonExecutives', (r.data->'indicateurs'->'représentation_équilibrée'->>'motif_non_calculabilité_cadres')::text,
          'notComputableReasonMembers', (r.data->'indicateurs'->'représentation_équilibrée'->>'motif_non_calculabilité_membres')::text
        )) as results
      FROM representation_equilibree r
      JOIN search_representation_equilibree s ON r.siren = s.siren AND r.year = s.year
      ${sqlWhereClause}
      GROUP BY r.siren
      ORDER BY max(r.year) DESC
      LIMIT ${criteria.limit ?? 10}
      OFFSET ${criteria.offset ?? 0}
    `;

    const raws = await this.prisma.$queryRawUnsafe(query);
    return (raws as RepresentationEquilibreeSearchResultRaw[]).map(
      representationEquilibreeSearchResultMap.toDomain,
    );
  }

  public async count(
    criteria: RepresentationEquilibreeSearchCriteria,
  ): Promise<number> {
    const sqlWhereClause = this.buildSearchWhereClause(criteria);

    try {
      const [{ count }] = await this
        .sql<SQLCount>`select count(distinct(siren)) as count from ${this.table} ${sqlWhereClause}`;
      return +count;
    } catch (e: unknown) {
      const postgreError = e as PostgresError;
      console.log(
        "!!!!PostgresError!!!!!!!!!",
        postgreError.cause,
        postgreError.query,
      );
      throw e;
    }
  }

  private buildSearchWhereClause(
    criteria: RepresentationEquilibreeSearchCriteria,
  ) {
    let sqlQuery = sql``;
    if (criteria.query) {
      if (criteria.query.length === 9 && isFinite(+criteria.query)) {
        sqlQuery = sql`and ${this.table}.siren=${criteria.query}`;
      } else {
        sqlQuery = sql`and ${this.table}.ft @@ to_tsquery('ftdict', ${cleanFullTextSearch(criteria.query)})`;
      }
    }

    // no "and" clause because will be first
    const sqlYear = sql`${this.table}.year in ${sql(PUBLIC_YEARS_REPEQ)}`;
    const sqlDepartement = criteria.countyCode
      ? sql`and ${this.table}.departement=${criteria.countyCode}`
      : sql``;
    const sqlSectionNaf = criteria.nafSection
      ? sql`and ${this.table}.section_naf=${criteria.nafSection}`
      : sql``;
    const sqlRegion = criteria.regionCode
      ? sql`and ${this.table}.region=${criteria.regionCode}`
      : sql``;

    const where = sql`where ${sqlYear} ${sqlDepartement} ${sqlSectionNaf} ${sqlRegion} ${sqlQuery}`;
    return where;
  }
}
