import "server-only";

import { and, count, eq, ilike, isNotNull, or, sql } from "drizzle-orm";

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
		const term = `%${input.q}%`;
		const queryFilter = or(
			ilike(companies.name, term),
			ilike(declarations.siren, term),
		);
		if (queryFilter) baseConditions.push(queryFilter);
	}

	if (input.region) {
		baseConditions.push(eq(companies.region, input.region));
	}

	if (input.departement) {
		baseConditions.push(eq(companies.departmentCode, input.departement));
	}

	if (input.naf) {
		baseConditions.push(eq(companies.nafCode, input.naf));
	}

	if (input.year) {
		baseConditions.push(eq(declarations.year, input.year));
	}

	const where = and(...baseConditions);

	const [rows, countResult] = await Promise.all([
		db
			.select({
				...publicDeclarationColumns,
				siren: companies.siren,
				name: companies.name,
				address: companies.address,
				region: companies.region,
				departmentCode: companies.departmentCode,
				departmentLabel: companies.departmentLabel,
				nafCode: companies.nafCode,
				nafLabel: companies.nafLabel,
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
			.limit(input.limit)
			.offset(input.offset),
		db
			.select({ total: count() })
			.from(declarations)
			.innerJoin(companies, eq(declarations.siren, companies.siren))
			.innerJoin(
				campaignDeadlines,
				eq(declarations.year, campaignDeadlines.year),
			)
			.where(where),
	]);

	const data = rows.map((row) =>
		toPublicDeclaration(row, {
			siren: row.siren,
			name: row.name,
			address: row.address ?? null,
			region: row.region ?? null,
			departmentCode: row.departmentCode ?? null,
			departmentLabel: row.departmentLabel ?? null,
			nafCode: row.nafCode ?? null,
			nafLabel: row.nafLabel ?? null,
			statutDiffusion: null,
			workforceEma: row.workforceEma ?? null,
		}),
	);

	return {
		data,
		count: countResult[0]?.total ?? 0,
	};
}
