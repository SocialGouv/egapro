import { type AdminDeclarationRaw } from "@api/core-domain/infra/db/raw";
import { db } from "@api/shared-domain/infra/db/drizzle";
import {
  declaration,
  representationEquilibree,
  search,
  searchRepresentationEquilibree,
} from "@api/shared-domain/infra/db/schema";
import { type AdminDeclarationDTO } from "@common/core-domain/dtos/AdminDeclarationDTO";
import { type SQLCount } from "@common/shared-domain";
import { cleanFullTextSearch } from "@common/utils/postgres";
import { isFinite as isFiniteNumber } from "lodash";
import { sql } from "drizzle-orm";

import {
  type AdminDeclarationSearchCriteria,
  type IAdminDeclarationRepo,
  orderByMap,
} from "../IAdminDeclarationRepo";

export class PostgresAdminDeclarationRepo implements IAdminDeclarationRepo {
  constructor(private drizzle: typeof db = db) {}

  public async search(
    criteria: AdminDeclarationSearchCriteria,
  ): Promise<AdminDeclarationDTO[]> {
    const cteCombined = sql.identifier("cte_combined");

    const raws = (await this.drizzle.execute(sql`
      WITH ${cteCombined} AS (
        SELECT ${declaration}.declared_at AS created_at,
               ${declaration}.data->'déclarant'->>'email' AS declarant_email,
               ${declaration}.data->'déclarant'->>'prénom' AS declarant_firstname,
               ${declaration}.data->'déclarant'->>'nom' AS declarant_lastname,
               ${declaration}.data->'entreprise'->>'raison_sociale' AS name,
               ${declaration}.data->'entreprise'->>'siren' AS siren,
               'index' AS type,
               ${declaration}.year AS year,
               (${declaration}.data->'déclaration'->>'index')::int AS index,
               ${declaration}.data->'entreprise'->'ues' AS ues
        FROM ${declaration}
        JOIN ${search} ON ${declaration}.siren = ${search}.siren
                     AND ${search}.year = ${declaration}.year
        ${this.buildSearchWhereClause(criteria, { searchTable: search, dataTable: declaration })}

        UNION ALL

        SELECT ${representationEquilibree}.declared_at AS created_at,
               ${representationEquilibree}.data->'déclarant'->>'email' AS declarant_email,
               ${representationEquilibree}.data->'déclarant'->>'prénom' AS declarant_firstname,
               ${representationEquilibree}.data->'déclarant'->>'nom' AS declarant_lastname,
               ${representationEquilibree}.data->'entreprise'->>'raison_sociale' AS name,
               ${representationEquilibree}.data->'entreprise'->>'siren' AS siren,
               'repeq' AS type,
               ${representationEquilibree}.year,
               NULL AS index,
               NULL AS ues
        FROM ${representationEquilibree}
        JOIN ${searchRepresentationEquilibree} ON ${representationEquilibree}.siren = ${searchRepresentationEquilibree}.siren
                                              AND ${searchRepresentationEquilibree}.year = ${representationEquilibree}.year
        ${this.buildSearchWhereClause(criteria, { searchTable: searchRepresentationEquilibree, dataTable: representationEquilibree })}
      )
      SELECT *
      FROM ${cteCombined}
      ORDER BY ${sql.identifier(criteria.orderBy ? orderByMap[criteria.orderBy] : "created_at")} ${
        criteria.orderDirection === "asc" ? sql`asc` : sql`desc`
      }
      LIMIT ${criteria.limit ?? 100}
      OFFSET ${criteria.offset ?? 0};
    `)) as unknown as AdminDeclarationRaw[];

    return raws.map(
      (raw) =>
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
                      companies: raw.ues.entreprises?.map((entreprise) => ({
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

  public async count(
    criteria: AdminDeclarationSearchCriteria,
  ): Promise<number> {
    const cteCountDeclaration = sql.identifier("cte_count_declaration");
    const cteCountRepresentationEquilibree = sql.identifier(
      "cte_count_representation_equilibree",
    );

    const [{ count }] = (await this.drizzle.execute(sql`
      WITH 
        ${cteCountDeclaration} AS (
          SELECT COUNT(distinct(${search}.siren)) AS count1
          FROM ${search}
          JOIN ${declaration} ON ${search}.siren = ${declaration}.siren
                             AND ${declaration}.year = ${search}.year
          ${this.buildSearchWhereClause(criteria, { searchTable: search, dataTable: declaration })}
        ),
        ${cteCountRepresentationEquilibree} AS (
          SELECT COUNT(distinct(${searchRepresentationEquilibree}.siren)) AS count2
          FROM ${searchRepresentationEquilibree}
          JOIN ${representationEquilibree} ON ${searchRepresentationEquilibree}.siren = ${representationEquilibree}.siren
                                          AND ${representationEquilibree}.year = ${searchRepresentationEquilibree}.year
          ${this.buildSearchWhereClause(criteria, { searchTable: searchRepresentationEquilibree, dataTable: representationEquilibree })}
        )
      SELECT (count1 + count2) AS count
      FROM ${cteCountDeclaration}, ${cteCountRepresentationEquilibree};
    `)) as unknown as SQLCount;

    return +count;
  }

  private buildSearchWhereClause(
    criteria: AdminDeclarationSearchCriteria,
    {
      searchTable,
      dataTable,
    }: {
      searchTable: typeof search | typeof searchRepresentationEquilibree;
      dataTable: typeof declaration | typeof representationEquilibree;
    },
  ) {
    let hasWhere = false;

    let sqlYear = sql``;
    if (typeof criteria.year === "number") {
      sqlYear = sql`${searchTable}.year=${criteria.year}`;
      hasWhere = true;
    }

    let sqlEmail = sql``;
    if (criteria.email) {
      sqlEmail = sql`${hasWhere ? sql`and` : sql``} ${dataTable}.data->'déclarant'->>'email' like ${`%${criteria.email}%`}`;
      hasWhere = true;
    }

    let sqlIndexComparison = sql``;
    if (typeof criteria.index === "number" && criteria.indexComparison) {
      sqlIndexComparison = sql`${hasWhere ? sql`and` : sql``} (${dataTable}.data->'déclaration'->>'index')::int ${
        criteria.indexComparison === "gt"
          ? sql`>`
          : criteria.indexComparison === "lt"
            ? sql`<`
            : sql`=`
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
      sqlUes = sql`${hasWhere ? sql`and` : sql``} ${dataTable}.data->'entreprise'->'ues' IS NOT NULL`;
      hasWhere = true;
    }

    let sqlQuery = sql``;
    if (criteria.query) {
      if (criteria.query.length === 9 && isFiniteNumber(+criteria.query)) {
        sqlQuery = sql`${hasWhere ? sql`and` : sql``} ${searchTable}.siren=${criteria.query}`;
      } else {
        sqlQuery = sql`${hasWhere ? sql`and` : sql``} ${searchTable}.ft @@ to_tsquery('ftdict', ${cleanFullTextSearch(criteria.query)})`;
      }
      hasWhere = true;
    }

    return hasWhere
      ? sql`where ${sqlYear} ${sqlEmail} ${sqlIndexComparison} ${sqlMinDate} ${sqlMaxDate} ${sqlUes} ${sqlQuery}`
      : sql``;
  }
}
