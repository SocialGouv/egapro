import { type AdminDeclarationRaw } from "@api/core-domain/infra/db/raw";
import { sql } from "@api/shared-domain/infra/db/postgres";
import { type AdminDeclarationDTO } from "@common/core-domain/dtos/AdminDeclarationDTO";
import { PUBLIC_CURRENT_YEAR, PUBLIC_YEARS_REPEQ } from "@common/dict";
import { type SQLCount } from "@common/shared-domain";
import { cleanFullTextSearch } from "@common/utils/postgres";
import { isFinite } from "lodash";

import { type AdminDeclarationSearchCriteria, type IAdminDeclarationRepo } from "../IAdminDeclarationRepo";
import { type DeclarationStatsCriteria } from "../IDeclarationSearchRepo";
import { type RepresentationEquilibreeSearchCriteria } from "../IRepresentationEquilibreeSearchRepo";

export class PostgresAdminDeclarationRepo implements IAdminDeclarationRepo {
  private declaTable = sql("declaration");
  private representationEquilibreeTable = sql("representation_equilibree");
  private searchTable = sql("search");
  private searchRepresentationEquilibreeTable = sql("search_representation_equilibree");

  public async search(criteria: AdminDeclarationSearchCriteria): Promise<AdminDeclarationDTO[]> {
    const sqlWhereClause = this.buildSearchWhereClause(criteria);
    const raws = await sql<AdminDeclarationRaw[]>`
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
        JOIN ${this.searchTable} ON ${this.declaTable}.siren=${this.searchTable}.siren AND ${this.declaTable}.year=${
          this.searchTable
        }.year
            ${sqlWhereClause}
        GROUP BY ${this.declaTable}.siren
        ORDER BY max(${this.declaTable}.year) DESC
        LIMIT ${criteria.limit ?? 10}
        OFFSET ${criteria.offset ?? 0}`;

    return raws;
  }

  public async count(criteria: RepresentationEquilibreeSearchCriteria): Promise<number> {
    const sqlWhereClause = this.buildSearchWhereClause(criteria);

    const [{ count }] =
      await sql<SQLCount>`select count(distinct(siren)) as count from ${this.searchTable} ${sqlWhereClause}`;
    return +count;
  }

  private buildSearchWhereClause(criteria: RepresentationEquilibreeSearchCriteria) {
    let sqlQuery = sql``;
    if (criteria.query) {
      if (criteria.query.length === 9 && isFinite(+criteria.query)) {
        sqlQuery = sql`and ${this.searchTable}.siren=${criteria.query}`;
      } else {
        sqlQuery = sql`and ${this.searchTable}.ft @@ to_tsquery('ftdict', ${cleanFullTextSearch(criteria.query)})`;
      }
    }

    // no "and" clause because will be first
    const sqlYear = sql`${this.searchTable}.year in ${sql(PUBLIC_YEARS_REPEQ)}`;
    const sqlDepartement = criteria.countyCode
      ? sql`and ${this.searchTable}.departement=${criteria.countyCode}`
      : sql``;
    const sqlSectionNaf = criteria.nafSection ? sql`and ${this.searchTable}.section_naf=${criteria.nafSection}` : sql``;
    const sqlRegion = criteria.regionCode ? sql`and ${this.searchTable}.region=${criteria.regionCode}` : sql``;

    const where = sql`where ${sqlYear} ${sqlDepartement} ${sqlSectionNaf} ${sqlRegion} ${sqlQuery}`;
    return where;
  }

  private buildStatsWhereClause(criteria: DeclarationStatsCriteria) {
    const sqlYear = sql`${this.searchTable}.year=${Number(criteria.year) || PUBLIC_CURRENT_YEAR}`;
    const sqlDepartement = criteria.countyCode
      ? sql`and ${this.searchTable}.departement=${criteria.countyCode}`
      : sql``;
    const sqlSectionNaf = criteria.nafSection ? sql`and ${this.searchTable}.section_naf=${criteria.nafSection}` : sql``;
    const sqlRegion = criteria.regionCode ? sql`and ${this.searchTable}.region=${criteria.regionCode}` : sql``;

    const where = sql`where ${sqlYear} ${sqlDepartement} ${sqlSectionNaf} ${sqlRegion}`;
    return where;
  }
}
