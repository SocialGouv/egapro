import { type PublicStatsRaw } from "@api/core-domain/infra/db/raw";
import { sql } from "@api/shared-domain/infra/db/postgres";
import { type PublicStats } from "@common/core-domain/domain/PublicStats";
import { publicStatsMap } from "@common/core-domain/mappers/publicStatsMap";
import { CURRENT_YEAR } from "@common/dict";

import { type IPublicStatsRepo } from "../IPublicStatsRepo";

export class PostgresPublicStatsRepo implements IPublicStatsRepo {
  private repEqTable = sql("representation_equilibree");
  private declarationTable = sql("declaration");

  public async getAll(): Promise<PublicStats> {
    const cteRepEq = sql("cte_rep_eq");
    const cteIndex = sql("cte_index");
    const cteIndexLast3Yavg = sql("cte_index_last_three_years_average");
    const cteWorkforceRange = sql("cte_workforce_range_results");

    const [raw] = await sql<PublicStatsRaw[]>`
        WITH ${cteRepEq} AS (
          SELECT
            year,
            SUM(CASE WHEN year = ${CURRENT_YEAR} THEN 1 ELSE 0 END) AS count,
            SUM(CASE
              WHEN jsonb_typeof(data->'indicateurs'->'représentation_équilibrée'->'pourcentage_femmes_cadres') = 'number'
              AND (data->'indicateurs'->'représentation_équilibrée'->'pourcentage_femmes_cadres')::text::float >= 30 THEN 1
              ELSE 0
            END) AS countWomen30percentExecutives_gt,
            SUM(CASE
              WHEN jsonb_typeof(data->'indicateurs'->'représentation_équilibrée'->'pourcentage_femmes_cadres') = 'number' 
              AND (data->'indicateurs'->'représentation_équilibrée'->'pourcentage_femmes_cadres')::text::float < 30 THEN 1
              ELSE 0
            END) AS countWomen30percentExecutives_lte,
            SUM(CASE
              WHEN (data->'indicateurs'->'représentation_équilibrée'->'motif_non_calculabilité_cadres') IS NOT NULL THEN 1
              ELSE 0
            END) AS countWomen30percentExecutives_nc,
            SUM(CASE
              WHEN jsonb_typeof(data->'indicateurs'->'représentation_équilibrée'->'pourcentage_femmes_membres') = 'number' 
              AND (data->'indicateurs'->'représentation_équilibrée'->'pourcentage_femmes_membres')::text::float >= 30 THEN 1
              ELSE 0
            END) AS countWomen30percentMembers_gt,
            SUM(CASE
              WHEN jsonb_typeof(data->'indicateurs'->'représentation_équilibrée'->'pourcentage_femmes_membres') = 'number' 
              AND (data->'indicateurs'->'représentation_équilibrée'->'pourcentage_femmes_membres')::text::float < 30 THEN 1
              ELSE 0
            END) AS countWomen30percentMembers_lte,
            SUM(CASE
              WHEN (data->'indicateurs'->'représentation_équilibrée'->'motif_non_calculabilité_membres') IS NOT NULL THEN 1
              ELSE 0
            END) AS countWomen30percentMembers_nc
          FROM 
            ${this.repEqTable}
          GROUP BY 
            year
        ),
        ${cteWorkforceRange} AS (
          SELECT
            year,
            (data->'entreprise'->'effectif'->'tranche')::text AS workforce_range,
            COUNT(*) AS count,
            AVG(CASE 
              WHEN jsonb_typeof(data->'déclaration'->'index') = 'number' THEN (data->'déclaration'->'index')::text::numeric
              ELSE NULL
            END) AS average
          FROM 
            ${this.declarationTable}
          WHERE 
            year >= EXTRACT(YEAR FROM CURRENT_DATE) - 4
            AND (data->'entreprise'->'effectif'->'tranche')::text IS NOT NULL
          GROUP BY 
            year, workforce_range
        ),
        ${cteIndex} AS (
          SELECT
            year,
            SUM(count) AS count,
            AVG(average) AS average,
            jsonb_object_agg(workforce_range, count) AS countByWorkforceRange,
            jsonb_object_agg(workforce_range, average) AS averageByWorkforceRange
          FROM 
            ${cteWorkforceRange}
          GROUP BY 
            year
        ),
        ${cteIndexLast3Yavg} AS (
          SELECT
            jsonb_object_agg(year, average)::jsonb AS lastThreeYearsAverage
          FROM
            ${cteIndex}
        )
        SELECT
          t1.year,
          t1.count AS "representation_equilibree.count",
          t1.countWomen30percentExecutives_gt AS "representation_equilibree.countWomen30percentExecutives.gt",
          t1.countWomen30percentExecutives_lte AS "representation_equilibree.countWomen30percentExecutives.lte",
          t1.countWomen30percentExecutives_nc AS "representation_equilibree.countWomen30percentExecutives.nc",
          t1.countWomen30percentMembers_gt AS "representation_equilibree.countWomen30percentMembers.gt",
          t1.countWomen30percentMembers_lte AS "representation_equilibree.countWomen30percentMembers.lte",
          t1.countWomen30percentMembers_nc AS "representation_equilibree.countWomen30percentMembers.nc",
          t2.count AS "index.count",
          t2.average AS "index.average",
          t2.countByWorkforceRange AS "index.countByWorkforceRange",
          t2.averageByWorkforceRange AS "index.averageByWorkforceRange",
          t3.lastThreeYearsAverage AS "index.lastThreeYearsAverage"
        FROM
          ${cteRepEq} t1
        JOIN
          ${cteIndex} t2
        ON
          t1.year = t2.year
        CROSS JOIN
          ${cteIndexLast3Yavg} t3
        WHERE t1.year = ${CURRENT_YEAR};`;

    return publicStatsMap.toDomain(raw);
  }
}
