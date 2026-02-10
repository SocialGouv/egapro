import { type RepresentationEquilibreeSearchResultRaw } from "@api/core-domain/infra/db/raw";
import { db } from "@api/shared-domain/infra/db/drizzle";
import {
  representationEquilibree,
  searchRepresentationEquilibree,
} from "@api/shared-domain/infra/db/schema";
import { type RepresentationEquilibree } from "@common/core-domain/domain/RepresentationEquilibree";
import { type RepresentationEquilibreeSearchResult } from "@common/core-domain/domain/RepresentationEquilibreeSearchResult";
import { representationEquilibreeSearchMap } from "@common/core-domain/mappers/representationEquilibreeSearchMap";
import { representationEquilibreeSearchResultMap } from "@common/core-domain/mappers/representationEquilibreeSearchResultMap";
import { PUBLIC_YEARS_REPEQ } from "@common/dict";
import { type SQLCount } from "@common/shared-domain";
import { cleanFullTextSearch } from "@common/utils/postgres";
import { type Any } from "@common/utils/types";
import { isFinite as isFiniteNumber } from "lodash";
import { sql } from "drizzle-orm";

import {
  type IRepresentationEquilibreeSearchRepo,
  type RepresentationEquilibreeSearchCriteria,
} from "../IRepresentationEquilibreeSearchRepo";

export class PostgresRepresentationEquilibreeSearchRepo implements IRepresentationEquilibreeSearchRepo {
  constructor(private drizzle: typeof db = db) {}

  public async index(item: RepresentationEquilibree): Promise<void> {
    const raw = representationEquilibreeSearchMap.toPersistence(item);

    const values: Any = {
      ...raw,
      ft: sql`to_tsvector('ftdict', ${raw.ft})`,
    };

    await this.drizzle
      .insert(searchRepresentationEquilibree)
      .values(values)
      .onConflictDoUpdate({
        target: [
          searchRepresentationEquilibree.siren,
          searchRepresentationEquilibree.year,
        ],
        set: {
          declared_at: values.declared_at,
          ft: values.ft,
          region: values.region,
          departement: values.departement,
          section_naf: values.section_naf,
        },
      });
  }

  public async search(
    criteria: RepresentationEquilibreeSearchCriteria,
  ): Promise<RepresentationEquilibreeSearchResult[]> {
    const where = this.buildSearchWhereClause(criteria);

    const raws = (await this.drizzle.execute(sql`
      SELECT
        (jsonb_agg(${representationEquilibree}.data->'entreprise' ORDER BY ${representationEquilibree}.year DESC) -> 0) as company,
        jsonb_object_agg(${representationEquilibree}.year::text, json_build_object(
          'executiveMenPercent', replace((${representationEquilibree}.data->'indicateurs'->'représentation_équilibrée'->>'pourcentage_hommes_cadres')::text, ',', '.')::real,
          'executiveWomenPercent', replace((${representationEquilibree}.data->'indicateurs'->'représentation_équilibrée'->>'pourcentage_femmes_cadres')::text, ',', '.')::real,
          'memberMenPercent', replace((${representationEquilibree}.data->'indicateurs'->'représentation_équilibrée'->>'pourcentage_hommes_membres')::text, ',', '.')::real,
          'memberWomenPercent', replace((${representationEquilibree}.data->'indicateurs'->'représentation_équilibrée'->>'pourcentage_femmes_membres')::text, ',', '.')::real,
          'notComputableReasonExecutives', (${representationEquilibree}.data->'indicateurs'->'représentation_équilibrée'->>'motif_non_calculabilité_cadres')::text,
          'notComputableReasonMembers', (${representationEquilibree}.data->'indicateurs'->'représentation_équilibrée'->>'motif_non_calculabilité_membres')::text
        )) as results
      FROM ${representationEquilibree}
      JOIN ${searchRepresentationEquilibree} ON ${representationEquilibree}.siren=${searchRepresentationEquilibree}.siren
        AND ${representationEquilibree}.year=${searchRepresentationEquilibree}.year
      ${where}
      GROUP BY ${representationEquilibree}.siren
      ORDER BY max(${representationEquilibree}.year) DESC
      LIMIT ${criteria.limit ?? 10}
      OFFSET ${criteria.offset ?? 0}
    `)) as unknown as RepresentationEquilibreeSearchResultRaw[];

    return raws.map(representationEquilibreeSearchResultMap.toDomain);
  }

  public async count(
    criteria: RepresentationEquilibreeSearchCriteria,
  ): Promise<number> {
    const where = this.buildSearchWhereClause(criteria);

    const [{ count }] = (await this.drizzle
      .select({
        count: sql<string>`count(distinct(${searchRepresentationEquilibree.siren})) as count`,
      })
      .from(searchRepresentationEquilibree)
      .where(where)) as unknown as SQLCount;
    return +count;
  }

  private buildSearchWhereClause(
    criteria: RepresentationEquilibreeSearchCriteria,
  ) {
    let querySql = sql``;
    if (criteria.query) {
      if (criteria.query.length === 9 && isFiniteNumber(+criteria.query)) {
        querySql = sql`and ${searchRepresentationEquilibree}.siren=${criteria.query}`;
      } else {
        querySql = sql`and ${searchRepresentationEquilibree}.ft @@ to_tsquery('ftdict', ${cleanFullTextSearch(criteria.query)})`;
      }
    }

    const years = sql.join(
      (PUBLIC_YEARS_REPEQ as unknown as number[]).map((y) => sql`${y}`),
      sql`, `,
    );
    const sqlYear = sql`${searchRepresentationEquilibree}.year in (${years})`;
    const sqlDepartement = criteria.countyCode
      ? sql`and ${searchRepresentationEquilibree}.departement=${criteria.countyCode}`
      : sql``;
    const sqlSectionNaf = criteria.nafSection
      ? sql`and ${searchRepresentationEquilibree}.section_naf=${criteria.nafSection}`
      : sql``;
    const sqlRegion = criteria.regionCode
      ? sql`and ${searchRepresentationEquilibree}.region=${criteria.regionCode}`
      : sql``;

    return sql`where ${sqlYear} ${sqlDepartement} ${sqlSectionNaf} ${sqlRegion} ${querySql}`;
  }
}
