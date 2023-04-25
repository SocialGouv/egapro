import { type RepresentationEquilibreeSearchResultRaw } from "@api/core-domain/infra/db/raw";
import { sql } from "@api/shared-domain/infra/db/postgres";
import type { RepresentationEquilibree } from "@common/core-domain/domain/RepresentationEquilibree";
import { type RepresentationEquilibreeSearchResult } from "@common/core-domain/domain/RepresentationEquilibreeSearchResult";
import { representationEquilibreeSearchResultMap } from "@common/core-domain/mappers/representationEquilibreeSearchResultMap";
import { PUBLIC_YEARS_REPEQ } from "@common/dict";
import { type SQLCount } from "@common/shared-domain";
import { isFinite } from "lodash";

import {
  type IRepresentationEquilibreeSearchRepo,
  type RepresentationEquilibreeSearchCriteria,
} from "../IRepresentationEquilibreeSearchRepo";

/*

SELECT
    array_agg(representation_equilibree.data ORDER BY representation_equilibree.year DESC) as data,
    jsonb_object_agg(representation_equilibree.year::text, json_build_object(
        'executiveMenPercent', replace((representation_equilibree.data->'indicateurs'->'représentation_équilibrée'->>'pourcentage_hommes_cadres')::text, ',', '.')::real,
    )) as results
FROM representation_equilibree
JOIN search_representation_equilibree ON representation_equilibree.siren=search_representation_equilibree.siren AND representation_equilibree.year=search_representation_equilibree.year
    {where}
GROUP BY representation_equilibree.siren
ORDER BY max(representation_equilibree.year) DESC
LIMIT $1
OFFSET $2

CREATE TABLE IF NOT EXISTS search_representation_equilibree
(siren TEXT, year INT, declared_at TIMESTAMP WITH TIME ZONE, ft TSVECTOR, region VARCHAR(2), departement VARCHAR(3), section_naf CHAR,
PRIMARY KEY (siren, year));


*/
export class PostgresRepresentationEquilibreeSearchRepo implements IRepresentationEquilibreeSearchRepo {
  private repEqTable = sql("representation_equilibree");
  private table = sql("search_representation_equilibree");

  public index(_item: RepresentationEquilibree): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public async search(
    criteria: RepresentationEquilibreeSearchCriteria,
  ): Promise<RepresentationEquilibreeSearchResult[]> {
    const sqlWhereClause = this.buildSearchWhereClause(criteria);
    const raws = await sql<RepresentationEquilibreeSearchResultRaw[]>`
        SELECT
            array_agg(${this.repEqTable}.data ORDER BY ${this.repEqTable}.year DESC) as data,
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
    const [{ count }] =
      await sql<SQLCount>`select count(distinct(siren)) as count from ${this.table} ${sqlWhereClause}`;
    return +count;
  }

  private buildSearchWhereClause(criteria: RepresentationEquilibreeSearchCriteria) {
    let sqlQuery = sql``;
    if (criteria.query) {
      if (criteria.query.length === 9 && isFinite(criteria.query)) {
        sqlQuery = sql`and ${this.table}.siren=${criteria.query}`;
      } else {
        sqlQuery = sql`and ${this.table}.ft @@ to_tsquery('ftdict', ${criteria.query})`;
      }
    }

    // no "and" clause because will be first
    const sqlYear = sql`${this.table}.year in sql(${sql(PUBLIC_YEARS_REPEQ)})`;
    const sqlDepartement = criteria.countyCode ? sql`and ${this.table}.departement=${criteria.countyCode}` : sql``;
    const sqlSectionNaf = criteria.nafSection ? sql`and ${this.table}.section_naf=${criteria.nafSection}` : sql``;
    const sqlRegion = criteria.regionCode ? sql`and ${this.table}.region=${criteria.regionCode}` : sql``;

    const where = sql`where ${sqlYear} ${sqlDepartement} ${sqlSectionNaf} ${sqlRegion} ${sqlQuery}`;
    return where;
  }
}
