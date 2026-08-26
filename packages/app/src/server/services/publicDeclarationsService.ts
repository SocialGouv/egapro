import "server-only";

import {
	and,
	asc,
	countDistinct,
	desc,
	eq,
	ilike,
	isNotNull,
	or,
	sql,
} from "drizzle-orm";

import {
	type PublicSearchInput,
	type PublicSearchResultDTO,
	publicDeclarationColumns,
	toPublicDeclaration,
} from "~/modules/public-api";
import { db } from "~/server/db";
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
	const ranges: Record<string, [number, number]> = {
		A: [1, 3],
		B: [5, 9],
		C: [10, 33],
		D: [35, 35],
		E: [36, 39],
		F: [41, 43],
		G: [45, 47],
		H: [49, 53],
		I: [55, 56],
		J: [58, 63],
		K: [64, 66],
		L: [68, 68],
		M: [69, 75],
		N: [77, 82],
		O: [84, 84],
		P: [85, 85],
		Q: [86, 88],
		R: [90, 93],
		S: [94, 96],
		T: [97, 98],
		U: [99, 99],
	};
	const range = ranges[section.toUpperCase()];
	if (!range) return ilike(companies.nafCode, `${section}%`);
	return sql<number>`substring(${companies.nafCode} from 1 for 2)::integer between ${range[0]} and ${range[1]}`;
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
	const diffusibleIdentityCondition = sql`${companies.statutDiffusion} IS DISTINCT FROM 'N'`;

	if (input.q) {
		const normalizedQuery = input.q.replace(/\s/g, "");
		const term = `%${input.q}%`;
		const queryFilter = /^\d{9}$/.test(normalizedQuery)
			? eq(declarations.siren, normalizedQuery)
			: and(diffusibleIdentityCondition, ilike(companies.name, term));
		if (queryFilter) baseConditions.push(queryFilter);
	}

	if (input.city) {
		const cityFilter = and(
			diffusibleIdentityCondition,
			ilike(companies.city, `%${input.city}%`),
		);
		if (cityFilter) baseConditions.push(cityFilter);
	}

	if (input.region) {
		const regionFilter = or(
			eq(companies.regionCode, input.region),
			eq(companies.region, input.region),
		);
		if (regionFilter) baseConditions.push(regionFilter);
	}

	if (input.departement) {
		baseConditions.push(eq(companies.departmentCode, input.departement));
	}

	if (input.naf) {
		baseConditions.push(nafSectionCondition(input.naf));
	}

	if (input.workforceMin !== undefined) {
		baseConditions.push(
			sql`${gipMdsData.workforceEma}::numeric >= ${input.workforceMin}`,
		);
	}

	if (input.workforceMax !== undefined) {
		baseConditions.push(
			sql`${gipMdsData.workforceEma}::numeric <= ${input.workforceMax}`,
		);
	}

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
		asc(companies.name),
		asc(companies.siren),
		desc(declarations.year),
	];
	const order =
		input.sort === "year"
			? [desc(declarations.year), asc(companies.name), asc(companies.siren)]
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
