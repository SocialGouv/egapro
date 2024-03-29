import { type AdminDeclarationRaw } from "@api/core-domain/infra/db/raw";
import { sql } from "@api/shared-domain/infra/db/postgres";
import { type AdminDeclarationDTO } from "@common/core-domain/dtos/AdminDeclarationDTO";
import { type SQLCount } from "@common/shared-domain";
import { cleanFullTextSearch } from "@common/utils/postgres";
import { isFinite } from "lodash";
import { type Helper } from "postgres";

import { type AdminDeclarationSearchCriteria, type IAdminDeclarationRepo, orderByMap } from "../IAdminDeclarationRepo";

export class PostgresAdminDeclarationRepo implements IAdminDeclarationRepo {
  private declarationTable = sql("declaration");
  private representationEquilibreeTable = sql("representation_equilibree");
  private searchTable = sql("search");
  private searchRepresentationEquilibreeTable = sql("search_representation_equilibree");

  public async search(criteria: AdminDeclarationSearchCriteria): Promise<AdminDeclarationDTO[]> {
    const cteCombined = sql("cte_combined");

    const raws = await sql<AdminDeclarationRaw[]>`
      WITH ${cteCombined} AS (
          SELECT ${this.declarationTable}.declared_at AS created_at,
              ${this.declarationTable}.data->'déclarant'->>'email' AS declarant_email,
              ${this.declarationTable}.data->'déclarant'->>'prénom' AS declarant_firstname,
              ${this.declarationTable}.data->'déclarant'->>'nom' AS declarant_lastname,
              ${this.declarationTable}.data->'entreprise'->>'raison_sociale' AS name,
              ${this.declarationTable}.data->'entreprise'->>'siren' AS siren,
              'index' AS type,
              ${this.declarationTable}.year AS year,
              (${this.declarationTable}.data->'déclaration'->>'index')::int AS index,
              ${this.declarationTable}.data->'entreprise'->'ues' AS ues
          FROM ${this.declarationTable}
              JOIN ${this.searchTable} ON ${this.declarationTable}.siren = ${this.searchTable}.siren
              AND ${this.searchTable}.year = ${this.declarationTable}.year
          ${this.buildSearchWhereClause(criteria, this.searchTable, this.declarationTable)}
          UNION ALL
          SELECT ${this.representationEquilibreeTable}.declared_at AS created_at,
              ${this.representationEquilibreeTable}.data->'déclarant'->>'email' AS declarant_email,
              ${this.representationEquilibreeTable}.data->'déclarant'->>'prénom' AS declarant_firstname,
              ${this.representationEquilibreeTable}.data->'déclarant'->>'nom' AS declarant_lastname,
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
      ORDER BY ${sql(criteria.orderBy ? orderByMap[criteria.orderBy] : sql("created_at"))} ${
        criteria.orderDirection === "asc" ? sql`asc` : sql`desc`
      }
      LIMIT ${criteria.limit ?? 100}
      OFFSET ${criteria.offset ?? 0};`;

    return raws.map(
      raw =>
        ({
          createdAt: raw.created_at,
          declarantEmail: raw.declarant_email,
          declarantFirstName: raw.declarant_firstname,
          declarantLastName: raw.declarant_lastname,
          name: raw.name,
          siren: raw.siren,
          type: raw.type,
          year: raw.year,
          ...(raw.type === "index"
            ? {
                index: raw.index,
                ues: raw.ues
                  ? {
                      name: raw.ues.nom!,
                      companies: raw.ues.entreprises?.map(entreprise => ({
                        name: entreprise.raison_sociale,
                        siren: entreprise.siren,
                      })),
                    }
                  : void 0,
              }
            : {}),
        }) as AdminDeclarationDTO,
    );
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
