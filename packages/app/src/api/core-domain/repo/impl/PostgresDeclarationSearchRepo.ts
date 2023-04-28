import { type DeclarationSearchResultRaw, type DeclarationStatsRaw } from "@api/core-domain/infra/db/raw";
import { sql } from "@api/shared-domain/infra/db/postgres";
import { type Declaration } from "@common/core-domain/domain/Declaration";
import { type DeclarationSearchResult } from "@common/core-domain/domain/DeclarationSearchResult";
import { type DeclarationStatsDTO } from "@common/core-domain/dtos/SearchDeclarationDTO";
import { declarationSearchResultMap } from "@common/core-domain/mappers/declarationSearchResultMap";
import { PUBLIC_CURRENT_YEAR, PUBLIC_YEARS_REPEQ } from "@common/dict";
import { type SQLCount } from "@common/shared-domain";
import { isFinite } from "lodash";

import {
  type DeclarationSearchCriteria,
  type DeclarationStatsCriteria,
  type IDeclarationSearchRepo,
} from "../IDeclarationSearchRepo";
import { type RepresentationEquilibreeSearchCriteria } from "../IRepresentationEquilibreeSearchRepo";

export class PostgresDeclarationSearchRepo implements IDeclarationSearchRepo {
  private declaTable = sql("declaration");
  private table = sql("search");

  public index(_item: Declaration): Promise<void> {
    throw new Error("Method not implemented.");
  }

  public async stats(criteria: DeclarationStatsCriteria): Promise<DeclarationStatsDTO> {
    const sqlWhereClause = this.buildStatsWhereClause(criteria);
    const [raw] = await sql<DeclarationStatsRaw[]>`
        WITH subset AS (SELECT siren FROM ${this.table} ${sqlWhereClause}),
        count AS (SELECT COUNT(DISTINCT(siren))::int FROM subset),
        stats AS (SELECT avg((data->'déclaration'->>'index')::real),
                        min((data->'déclaration'->>'index')::int),
                        max((data->'déclaration'->>'index')::int)
                FROM ${this.declaTable}
                WHERE year=${criteria.year} AND siren IN (SELECT siren FROM subset))
        SELECT * FROM count JOIN stats ON true;`;

    return raw;
  }

  public async search(criteria: DeclarationSearchCriteria): Promise<DeclarationSearchResult[]> {
    const sqlWhereClause = this.buildSearchWhereClause(criteria);
    const raws = await sql<DeclarationSearchResultRaw[]>`
        SELECT
            (array_agg(${this.declaTable}.data ORDER BY ${
      this.declaTable
    }.year DESC))[1]->'entreprise'->>'siren' as siren,
                    (array_agg(${this.declaTable}.data ORDER BY ${
      this.declaTable
    }.year DESC))[1]->'entreprise'->>'raison_sociale' as name,
            jsonb_object_agg(${this.declaTable}.year::text, ${this.declaTable}.data) as data,
            jsonb_object_agg(${this.declaTable}.year::text, json_build_object(
                'index', (${this.declaTable}.data->'déclaration'->>'index')::int,
                'remunerationsScore', (${this.declaTable}.data->'indicateurs'->'rémunérations'->>'note')::int,
                'salaryRaisesScore', (${this.declaTable}.data->'indicateurs'->'augmentations'->>'note')::int,
                'promotionsScore', (${this.declaTable}.data->'indicateurs'->'promotions'->>'note')::int,
                'salaryRaisesAndPromotionsScore', (${
                  this.declaTable
                }.data->'indicateurs'->'augmentations_et_promotions'->>'note')::int,
                'maternityLeavesScore', (${this.declaTable}.data->'indicateurs'->'congés_maternité'->>'note')::int,
                'highRemunerationsScore', (${
                  this.declaTable
                }.data->'indicateurs'->'hautes_rémunérations'->>'note')::int,
                'notComputableReasonRemunerations', (${
                  this.declaTable
                }.data->'indicateurs'->'rémunérations'->>'non_calculable')::text,
                'notComputableReasonSalaryRaises', (${
                  this.declaTable
                }.data->'indicateurs'->'augmentations'->>'non_calculable')::text,
                'notComputableReasonPromotions', (${
                  this.declaTable
                }.data->'indicateurs'->'promotions'->>'non_calculable')::text,
                'notComputableReasonSalaryRaisesAndPromotions', (${
                  this.declaTable
                }.data->'indicateurs'->'augmentations_et_promotions'->>'non_calculable')::text,
                'notComputableReasonMaternityLeaves', (${
                  this.declaTable
                }.data->'indicateurs'->'congés_maternité'->>'non_calculable')::text
            )) as results
        FROM ${this.declaTable}
        JOIN ${this.table} ON ${this.declaTable}.siren=${this.table}.siren AND ${this.declaTable}.year=${
      this.table
    }.year
            ${sqlWhereClause}
        GROUP BY ${this.declaTable}.siren
        ORDER BY max(${this.declaTable}.year) DESC
        LIMIT ${criteria.limit ?? 10}
        OFFSET ${criteria.offset ?? 0}`;

    return raws.map(declarationSearchResultMap.toDomain);
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
    const sqlYear = sql`${this.table}.year in ${sql(PUBLIC_YEARS_REPEQ)}`;
    const sqlDepartement = criteria.countyCode ? sql`and ${this.table}.departement=${criteria.countyCode}` : sql``;
    const sqlSectionNaf = criteria.nafSection ? sql`and ${this.table}.section_naf=${criteria.nafSection}` : sql``;
    const sqlRegion = criteria.regionCode ? sql`and ${this.table}.region=${criteria.regionCode}` : sql``;

    const where = sql`where ${sqlYear} ${sqlDepartement} ${sqlSectionNaf} ${sqlRegion} ${sqlQuery}`;
    return where;
  }

  private buildStatsWhereClause(criteria: DeclarationStatsCriteria) {
    const sqlYear = sql`${this.table}.year=${Number(criteria.year) || PUBLIC_CURRENT_YEAR}`;
    const sqlDepartement = criteria.countyCode ? sql`and ${this.table}.departement=${criteria.countyCode}` : sql``;
    const sqlSectionNaf = criteria.nafSection ? sql`and ${this.table}.section_naf=${criteria.nafSection}` : sql``;
    const sqlRegion = criteria.regionCode ? sql`and ${this.table}.region=${criteria.regionCode}` : sql``;

    const where = sql`where ${sqlYear} ${sqlDepartement} ${sqlSectionNaf} ${sqlRegion}`;
    return where;
  }
}
