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

import {
  type IRepresentationEquilibreeSearchRepo,
  type RepresentationEquilibreeSearchCriteria,
} from "../IRepresentationEquilibreeSearchRepo";

export class PostgresRepresentationEquilibreeSearchRepo implements IRepresentationEquilibreeSearchRepo {
  private repEqTable = sql("representation_equilibree");
  private table = sql("search_representation_equilibree");
  private sql = sql;

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
    const update = sql(ftRaw, "declared_at", "ft", "region", "departement", "section_naf");

    await this.sql<
      RepresentationEquilibreeSearchRaw[]
    >`insert into ${this.table} ${insert} on conflict (siren, year) do update set ${update}`;
  }

  public async search(
    criteria: RepresentationEquilibreeSearchCriteria,
  ): Promise<RepresentationEquilibreeSearchResult[]> {
    const sqlWhereClause = this.buildSearchWhereClause(criteria);
    const raws = await this.sql<RepresentationEquilibreeSearchResultRaw[]>`
        SELECT
            (jsonb_agg(${this.repEqTable}.data->'entreprise' ORDER BY ${this.repEqTable}.year DESC) -> 0) as company,
            jsonb_object_agg(${this.repEqTable}.year::text, json_build_object(
                'executiveMenPercent', replace((${
                  this.repEqTable
                }.data->'indicateurs'->'représentation_équilibrée'->>'pourcentage_hommes_cadres')::text, ',', '.')::real,
                'executiveWomenPercent', replace((${
                  this.repEqTable
                }.data->'indicateurs'->'représentation_équilibrée'->>'pourcentage_femmes_cadres')::text, ',', '.')::real,
                'memberMenPercent', replace((${
                  this.repEqTable
                }.data->'indicateurs'->'représentation_équilibrée'->>'pourcentage_hommes_membres')::text, ',', '.')::real,
                'memberWomenPercent', replace((${
                  this.repEqTable
                }.data->'indicateurs'->'représentation_équilibrée'->>'pourcentage_femmes_membres')::text, ',', '.')::real,
                'notComputableReasonExecutives', (${
                  this.repEqTable
                }.data->'indicateurs'->'représentation_équilibrée'->>'motif_non_calculabilité_cadres')::text,
                'notComputableReasonMembers', (${
                  this.repEqTable
                }.data->'indicateurs'->'représentation_équilibrée'->>'motif_non_calculabilité_membres')::text
            )) as results
        FROM ${this.repEqTable}
        JOIN ${this.table} ON ${this.repEqTable}.siren=${this.table}.siren AND ${this.repEqTable}.year=${
      this.table
    }.year
            ${sqlWhereClause}
        GROUP BY ${this.repEqTable}.siren
        ORDER BY max(${this.repEqTable}.year) DESC
        LIMIT ${criteria.limit ?? 10}
        OFFSET ${criteria.offset ?? 0}`;

    return raws.map(representationEquilibreeSearchResultMap.toDomain);
  }

  public async count(criteria: RepresentationEquilibreeSearchCriteria): Promise<number> {
    const sqlWhereClause = this.buildSearchWhereClause(criteria);

    try {
      const [{ count }] = await this
        .sql<SQLCount>`select count(distinct(siren)) as count from ${this.table} ${sqlWhereClause}`;
      return +count;
    } catch (e: unknown) {
      const postgreError = e as PostgresError;
      console.log("!!!!PostgresError!!!!!!!!!", postgreError.cause, postgreError.query);
      throw e;
    }
  }

  private buildSearchWhereClause(criteria: RepresentationEquilibreeSearchCriteria) {
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
    const sqlDepartement = criteria.countyCode ? sql`and ${this.table}.departement=${criteria.countyCode}` : sql``;
    const sqlSectionNaf = criteria.nafSection ? sql`and ${this.table}.section_naf=${criteria.nafSection}` : sql``;
    const sqlRegion = criteria.regionCode ? sql`and ${this.table}.region=${criteria.regionCode}` : sql``;

    const where = sql`where ${sqlYear} ${sqlDepartement} ${sqlSectionNaf} ${sqlRegion} ${sqlQuery}`;
    return where;
  }
}
