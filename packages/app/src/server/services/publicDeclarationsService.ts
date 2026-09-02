import "server-only";

import {
	and,
	asc,
	countDistinct,
	desc,
	eq,
	ilike,
	inArray,
	isNotNull,
	or,
	type SQL,
	sql,
} from "drizzle-orm";

import {
	NAF_SECTION_DIVISIONS,
	type NafSection,
	OBSERVATORY_WORKFORCE_RANGES,
} from "~/modules/domain";
import {
	type PublicSearchInput,
	type PublicSearchResultDTO,
	publicDeclarationColumns,
	toPublicDeclaration,
} from "~/modules/public-api";
import { db } from "~/server/db";
import {
	diffusibleCompanyCondition,
	publicCompanyNameSortKey,
} from "~/server/db/companyConditions";
import {
	notCancelledCondition,
	submittedDeclarationCondition,
} from "~/server/db/declarationConditions";
import {
	campaignDeadlines,
	companies,
	declarations,
	gipMdsData,
} from "~/server/db/schema";

export function nafSectionCondition(section: string) {
	const range = NAF_SECTION_DIVISIONS[section.toUpperCase() as NafSection];
	if (!range) return ilike(companies.nafCode, `${section}%`);
	return sql<number>`substring(${companies.nafCode} from 1 for 2)::integer between ${range[0]} and ${range[1]}`;
}

export type PublicDeclarationFacets = Pick<
	PublicSearchInput,
	| "city"
	| "region"
	| "departement"
	| "naf"
	| "workforceMin"
	| "workforceMax"
	| "workforceRanges"
>;

/**
 * Facet conditions shared by the search endpoint and the export endpoint, so a
 * download always covers exactly the result set the user was looking at.
 *
 * Repeated values inside one facet are OR-ed (a company in either region
 * matches); different facets are AND-ed by the caller. `year` is deliberately
 * absent: search falls back to each company's latest publishable year when no
 * year is given, while the export spans every year.
 */
export function publicDeclarationFacetConditions(
	facets: PublicDeclarationFacets,
): SQL[] {
	const conditions: SQL[] = [];

	if (facets.city) {
		const cityFilter = and(
			diffusibleCompanyCondition(),
			ilike(companies.city, `%${facets.city}%`),
		);
		if (cityFilter) conditions.push(cityFilter);
	}

	if (facets.region?.length) {
		// The facet accepts both the INSEE code and the label, as the column pair
		// is populated inconsistently across import sources.
		const regionFilter = or(
			inArray(companies.regionCode, facets.region),
			inArray(companies.region, facets.region),
		);
		if (regionFilter) {
			const publicRegionFilter = and(
				diffusibleCompanyCondition(),
				regionFilter,
			);
			if (publicRegionFilter) conditions.push(publicRegionFilter);
		}
	}

	if (facets.departement?.length) {
		const departmentFilter = and(
			diffusibleCompanyCondition(),
			inArray(companies.departmentCode, facets.departement),
		);
		if (departmentFilter) conditions.push(departmentFilter);
	}

	if (facets.naf?.length) {
		const nafFilter = or(...facets.naf.map(nafSectionCondition));
		if (nafFilter) {
			const publicNafFilter = and(diffusibleCompanyCondition(), nafFilter);
			if (publicNafFilter) conditions.push(publicNafFilter);
		}
	}

	if (facets.workforceRanges?.length) {
		const rangeFilter = or(
			...facets.workforceRanges.map((key) => {
				const { min, max } = OBSERVATORY_WORKFORCE_RANGES[key];
				return max === null
					? sql`${gipMdsData.workforceEma}::numeric >= ${min}`
					: sql`${gipMdsData.workforceEma}::numeric between ${min} and ${max}`;
			}),
		);
		if (rangeFilter) conditions.push(rangeFilter);
	}

	if (facets.workforceMin !== undefined) {
		conditions.push(
			sql`${gipMdsData.workforceEma}::numeric >= ${facets.workforceMin}`,
		);
	}

	if (facets.workforceMax !== undefined) {
		conditions.push(
			sql`${gipMdsData.workforceEma}::numeric <= ${facets.workforceMax}`,
		);
	}

	return conditions;
}

export async function searchPublicDeclarations(
	input: PublicSearchInput,
): Promise<PublicSearchResultDTO> {
	const baseConditions = [
		notCancelledCondition(),
		submittedDeclarationCondition(),
		isNotNull(campaignDeadlines.publicDataReleaseDate),
		sql`${campaignDeadlines.publicDataReleaseDate} <= CURRENT_DATE`,
	];
	if (input.q) {
		const normalizedQuery = input.q.replace(/\s/g, "");
		const term = `%${input.q}%`;
		const queryFilter = /^\d{9}$/.test(normalizedQuery)
			? eq(declarations.siren, normalizedQuery)
			: and(diffusibleCompanyCondition(), ilike(companies.name, term));
		if (queryFilter) baseConditions.push(queryFilter);
	}

	baseConditions.push(...publicDeclarationFacetConditions(input));

	if (input.year) {
		baseConditions.push(eq(declarations.year, input.year));
	} else {
		// Search results represent companies, not declaration-years. Keep only
		// the newest publishable declaration for each SIREN; the detail route
		// exposes the complete multi-year history.
		baseConditions.push(sql`${declarations.year} = (
			SELECT MAX(d2.year)
			FROM app_declaration d2
			INNER JOIN app_campaign_deadline c2 ON c2.year = d2.year
			WHERE d2.siren = ${declarations.siren}
				AND d2.cancelled_at IS NULL
				AND d2.status <> 'draft'
				AND c2.public_data_release_date IS NOT NULL
				AND c2.public_data_release_date <= CURRENT_DATE
		)`);
	}

	const where = and(...baseConditions);

	const alphabeticalOrder = [
		asc(publicCompanyNameSortKey()),
		asc(companies.siren),
		desc(declarations.year),
	];
	const order =
		input.sort === "year"
			? [
					desc(declarations.year),
					asc(publicCompanyNameSortKey()),
					asc(companies.siren),
				]
			: input.sort === "name" || !input.q
				? alphabeticalOrder
				: [
						sql`CASE WHEN ${companies.siren} = ${input.q.replace(/\s/g, "")} THEN 0 WHEN lower(${companies.name}) = lower(${input.q}) THEN 1 ELSE 2 END`,
						...alphabeticalOrder,
					];

	const [rows, countResult] = await Promise.all([
		db
			.select({
				...publicDeclarationColumns,
				siren: companies.siren,
				name: companies.name,
				address: companies.address,
				city: companies.city,
				regionCode: companies.regionCode,
				region: companies.region,
				departmentCode: companies.departmentCode,
				departmentLabel: companies.departmentLabel,
				countryCode: companies.countryCode,
				countryLabel: companies.countryLabel,
				nafCode: companies.nafCode,
				nafLabel: companies.nafLabel,
				statutDiffusion: companies.statutDiffusion,
				workforceEma: gipMdsData.workforceEma,
			})
			.from(declarations)
			.innerJoin(companies, eq(declarations.siren, companies.siren))
			.innerJoin(
				campaignDeadlines,
				eq(declarations.year, campaignDeadlines.year),
			)
			.leftJoin(
				gipMdsData,
				and(
					eq(declarations.siren, gipMdsData.siren),
					eq(declarations.year, gipMdsData.year),
				),
			)
			.where(where)
			.orderBy(...order)
			.limit(input.limit)
			.offset(input.offset),
		db
			.select({ total: countDistinct(companies.siren) })
			.from(declarations)
			.innerJoin(companies, eq(declarations.siren, companies.siren))
			.innerJoin(
				campaignDeadlines,
				eq(declarations.year, campaignDeadlines.year),
			)
			.leftJoin(
				gipMdsData,
				and(
					eq(declarations.siren, gipMdsData.siren),
					eq(declarations.year, gipMdsData.year),
				),
			)
			.where(where),
	]);

	const data = rows.map((row) =>
		toPublicDeclaration(row, {
			siren: row.siren,
			name: row.name,
			address: row.address ?? null,
			city: row.city ?? null,
			regionCode: row.regionCode ?? null,
			region: row.region ?? null,
			departmentCode: row.departmentCode ?? null,
			departmentLabel: row.departmentLabel ?? null,
			countryCode: row.countryCode ?? null,
			countryLabel: row.countryLabel ?? null,
			nafCode: row.nafCode ?? null,
			nafLabel: row.nafLabel ?? null,
			statutDiffusion: row.statutDiffusion ?? null,
			workforceEma: row.workforceEma ?? null,
		}),
	);

	return {
		data,
		count: countResult[0]?.total ?? 0,
	};
}

export async function listPublicCompanySirens(
	limit = 50_000,
	offset = 0,
): Promise<string[]> {
	const rows = await db
		.selectDistinct({ siren: declarations.siren })
		.from(declarations)
		.innerJoin(campaignDeadlines, eq(declarations.year, campaignDeadlines.year))
		.where(
			and(
				notCancelledCondition(),
				submittedDeclarationCondition(),
				isNotNull(campaignDeadlines.publicDataReleaseDate),
				sql`${campaignDeadlines.publicDataReleaseDate} <= CURRENT_DATE`,
			),
		)
		.orderBy(asc(declarations.siren))
		.limit(limit)
		.offset(offset);
	return rows.map((row) => row.siren);
}

export async function countPublicCompanySirens(): Promise<number> {
	const rows = await db
		.select({ total: countDistinct(declarations.siren) })
		.from(declarations)
		.innerJoin(campaignDeadlines, eq(declarations.year, campaignDeadlines.year))
		.where(
			and(
				notCancelledCondition(),
				submittedDeclarationCondition(),
				isNotNull(campaignDeadlines.publicDataReleaseDate),
				sql`${campaignDeadlines.publicDataReleaseDate} <= CURRENT_DATE`,
			),
		);
	return rows[0]?.total ?? 0;
}
