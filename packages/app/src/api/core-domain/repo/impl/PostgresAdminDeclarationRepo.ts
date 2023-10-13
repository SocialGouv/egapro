import { type AdminDeclarationRaw } from "@api/core-domain/infra/db/raw";
import { sql } from "@api/shared-domain/infra/db/postgres";
import { type AdminDeclarationDTO } from "@common/core-domain/dtos/AdminDeclarationDTO";
import { type SQLCount } from "@common/shared-domain";
import { cleanFullTextSearch } from "@common/utils/postgres";
import { type Any } from "@common/utils/types";
import { isFinite } from "lodash";
import { type Helper } from "postgres";

import { type AdminDeclarationSearchCriteria, type IAdminDeclarationRepo } from "../IAdminDeclarationRepo";

export class PostgresAdminDeclarationRepo implements IAdminDeclarationRepo {
  private declarationTable = sql("declaration");
  private representationEquilibreeTable = sql("representation_equilibree");
  private searchTable = sql("search");
  private searchRepresentationEquilibreeTable = sql("search_representation_equilibree");

  public async search(criteria: AdminDeclarationSearchCriteria): Promise<AdminDeclarationDTO[]> {
    const cteCombined = sql("cte_combined");
    // const raws = await sql<AdminDeclarationRaw[]>`
    const query = sql<AdminDeclarationRaw[]>`
      WITH ${cteCombined} AS (
          SELECT ${this.declarationTable}.declared_at AS createdAt,
              ${this.declarationTable}.data->'déclarant'->>'email' AS declarantEmail,
              ${this.declarationTable}.data->'déclarant'->>'prénom' AS declarantFirstName,
              ${this.declarationTable}.data->'déclarant'->>'nom' AS declarantLastName,
              ${this.declarationTable}.data->'entreprise'->>'raison_sociale' AS name,
              ${this.declarationTable}.data->'entreprise'->>'siren' AS siren,
              'index' AS type,
              ${this.declarationTable}.year,
              (${this.declarationTable}.data->'déclaration'->>'index')::int AS index,
              CASE
                  WHEN ${this.declarationTable}.data->'entreprise'->'ues' IS NOT NULL THEN jsonb_build_object(
                      'companies',
                      (
                          SELECT jsonb_agg(
                                  jsonb_build_object(
                                      'name',
                                      entreprise->>'raison_sociale',
                                      'siren',
                                      entreprise->>'siren'
                                  )
                              )
                          FROM jsonb_array_elements(
                                  ${this.declarationTable}.data->'entreprise'->'ues'->'entreprises'
                              ) AS entreprise
                      ),
                      'name',
                      ${this.declarationTable}.data->'entreprise'->'ues'->>'nom'
                  )
                  ELSE NULL
              END AS ues
          FROM ${this.declarationTable}
              JOIN ${this.searchTable} ON ${this.declarationTable}.siren = ${this.searchTable}.siren
              AND ${this.searchTable}.year = ${this.declarationTable}.year
          ${this.buildSearchWhereClause(criteria, this.searchTable, this.declarationTable)}
          UNION ALL
          SELECT ${this.representationEquilibreeTable}.declared_at AS createdAt,
              ${this.representationEquilibreeTable}.data->'déclarant'->>'email' AS declarantEmail,
              ${this.representationEquilibreeTable}.data->'déclarant'->>'prénom' AS declarantFirstName,
              ${this.representationEquilibreeTable}.data->'déclarant'->>'nom' AS declarantLastName,
              ${this.representationEquilibreeTable}.data->'entreprise'->>'raison_sociale' AS name,
              ${this.representationEquilibreeTable}.data->'entreprise'->>'siren' AS siren,
              'repeq' AS type,
              ${this.representationEquilibreeTable}.year,
              NULL AS index,
              NULL AS ues
          FROM ${this.representationEquilibreeTable}
              JOIN ${this.searchRepresentationEquilibreeTable} ON ${this.representationEquilibreeTable}.siren = ${
                this.searchRepresentationEquilibreeTable
              }.siren
              AND ${this.searchRepresentationEquilibreeTable}.year = ${this.representationEquilibreeTable}.year
          ${this.buildSearchWhereClause(
            criteria,
            this.searchRepresentationEquilibreeTable,
            this.representationEquilibreeTable,
          )}
      )
      SELECT *
      FROM ${cteCombined}
      order by createdAt asc,
          siren desc
      LIMIT ${criteria.limit ?? 100}
      OFFSET ${criteria.offset ?? 0};;`;

    const desc = await query.describe();
    console.log("=================", desc.);
    console.log("zaeazleezlakelzakekkekekkekekekekelloeeezaekekekekkekekkekekekkekekekekq");

    const raws = await query;
    return raws.map(raw => ({
      createdAt: raw.createdat,
      declarantEmail: raw.declarantemail,
      declarantFirstName: raw.declarantfirstname,
      declarantLastName: raw.declarantlastname,
      name: raw.name,
      siren: raw.siren,
      type: raw.type,
      year: raw.year,
      ...(raw.type === "index" &&
        ({
          index: raw.index,
          ues: raw.ues,
        } as Any)),
    }));
  }

  public async count(criteria: AdminDeclarationSearchCriteria): Promise<number> {
    const cteCountDeclaration = sql("cte_count_declaration");
    const cteCountRepresentationEquilibree = sql("cte_count_representation_equilibree");

    const [{ count }] = await sql<SQLCount>`
    WITH 
        ${cteCountDeclaration} AS (
            SELECT COUNT(distinct(${this.searchTable}.siren)) AS count1
            FROM ${this.searchTable}
            JOIN ${this.declarationTable} ON ${this.searchTable}.siren = ${this.declarationTable}.siren
              AND ${this.declarationTable}.year = ${this.searchTable}.year
            ${this.buildSearchWhereClause(criteria, this.searchTable, this.declarationTable)}
        ),
        ${cteCountRepresentationEquilibree} AS (
            SELECT COUNT(distinct(${this.searchRepresentationEquilibreeTable}.siren)) AS count2
            FROM ${this.searchRepresentationEquilibreeTable}
            JOIN ${this.representationEquilibreeTable} ON ${this.searchRepresentationEquilibreeTable}.siren = ${
              this.representationEquilibreeTable
            }.siren
              AND ${this.representationEquilibreeTable}.year = ${this.searchRepresentationEquilibreeTable}.year
            ${this.buildSearchWhereClause(
              criteria,
              this.searchRepresentationEquilibreeTable,
              this.representationEquilibreeTable,
            )}
        )
    SELECT 
        (count1 + count2) AS count
    FROM 
        ${cteCountDeclaration}, ${cteCountRepresentationEquilibree};`;
    return +count;
  }

  private buildSearchWhereClause(
    criteria: AdminDeclarationSearchCriteria,
    searchTable: Helper<string>,
    table: Helper<string>,
  ) {
    let hasWhere = false;

    let sqlYear = sql``;
    if (typeof criteria.year === "number") {
      // no sql`and` here because it's the first condition
      sqlYear = sql`${searchTable}.year=${criteria.year}`;
      hasWhere = true;
    }

    let sqlEmail = sql``;
    if (criteria.email) {
      sqlEmail = sql`${hasWhere ? sql`and` : sql``} ${table}.data->'déclarant'->>'email' like ${`%${criteria.email}%`}`;
      hasWhere = true;
    }

    let sqlIndexComparison = sql``;
    if (typeof criteria.index === "number" && criteria.indexComparison) {
      sqlIndexComparison = sql`${hasWhere ? sql`and` : sql``} (${table}.data->'déclaration'->>'index')::int ${
        criteria.indexComparison === "gt" ? sql`>` : criteria.indexComparison === "lt" ? sql`<` : sql`=`
      } ${criteria.index}`;
      hasWhere = true;
    }

    let sqlMinDate = sql``;
    if (criteria.minDate) {
      sqlMinDate = sql`${hasWhere ? sql`and` : sql``} ${searchTable}.declared_at >= ${criteria.minDate}`;
      hasWhere = true;
    }

    let sqlMaxDate = sql``;
    if (criteria.maxDate) {
      sqlMaxDate = sql`${hasWhere ? sql`and` : sql``} ${searchTable}.declared_at <= ${criteria.maxDate}`;
      hasWhere = true;
    }

    let sqlUes = sql``;
    if (criteria.ues) {
      sqlUes = sql`${hasWhere ? sql`and` : sql``} ${table}.data->'entreprise'->'ues' IS NOT NULL`;
      hasWhere = true;
    }

    let sqlQuery = sql``;
    if (criteria.query) {
      if (criteria.query.length === 9 && isFinite(+criteria.query)) {
        sqlQuery = sql`${hasWhere ? sql`and` : sql``} ${searchTable}.siren=${criteria.query}`;
      } else {
        sqlQuery = sql`${hasWhere ? sql`and` : sql``} ${searchTable}.ft @@ to_tsquery('ftdict', ${cleanFullTextSearch(
          criteria.query,
        )})`;
      }
      hasWhere = true;
    }

    return hasWhere
      ? sql`where ${sqlYear} ${sqlEmail} ${sqlIndexComparison} ${sqlMinDate} ${sqlMaxDate} ${sqlUes} ${sqlQuery}`
      : sql``;
  }
}
