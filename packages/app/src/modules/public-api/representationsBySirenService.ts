import "server-only";

import { and, asc, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "~/server/db";
import {
	diffusibleCompanyCondition,
	publicCompanyNameSortKey,
} from "~/server/db/companyConditions";
import { companies, representationDeclarations } from "~/server/db/schema";
import type { PublicRepresentationCompanySource } from "./representationProjection";
import {
	publicRepresentationColumns,
	toPublicRepresentation,
} from "./representationProjection";
import type {
	PublicRepresentationDTO,
	PublicRepresentationSearchInput,
	PublicRepresentationSearchResultDTO,
} from "./schemas";

const representationCompanyColumns = {
	siren: companies.siren,
	name: companies.name,
	address: companies.address,
	regionCode: companies.regionCode,
	region: companies.region,
	departmentCode: companies.departmentCode,
	departmentLabel: companies.departmentLabel,
	nafCode: companies.nafCode,
	nafLabel: companies.nafLabel,
	statutDiffusion: companies.statutDiffusion,
};

function submittedRepresentationCondition() {
	return eq(representationDeclarations.status, "submitted");
}

function toCompanySource(row: {
	siren: string;
	name: string;
	address: string | null;
	region: string | null;
	departmentCode: string | null;
	departmentLabel: string | null;
	nafCode: string | null;
	nafLabel: string | null;
	statutDiffusion: string | null;
}): PublicRepresentationCompanySource {
	return {
		siren: row.siren,
		name: row.name,
		address: row.address,
		region: row.region,
		departmentCode: row.departmentCode,
		departmentLabel: row.departmentLabel,
		nafCode: row.nafCode,
		nafLabel: row.nafLabel,
		statutDiffusion: row.statutDiffusion,
	};
}

export async function searchPublicRepresentations(
	input: PublicRepresentationSearchInput,
): Promise<PublicRepresentationSearchResultDTO> {
	const baseConditions = [submittedRepresentationCondition()];

	if (input.q) {
		const normalizedQuery = input.q.replace(/\s/g, "");
		const term = `%${input.q}%`;
		const queryFilter = /^\d{9}$/.test(normalizedQuery)
			? eq(representationDeclarations.siren, normalizedQuery)
			: and(diffusibleCompanyCondition(), ilike(companies.name, term));
		if (queryFilter) baseConditions.push(queryFilter);
	}

	if (input.region?.length) {
		const regionFilter = and(
			diffusibleCompanyCondition(),
			or(
				inArray(companies.regionCode, input.region),
				inArray(companies.region, input.region),
			),
		);
		if (regionFilter) baseConditions.push(regionFilter);
	}

	if (input.departement?.length) {
		const departmentFilter = and(
			diffusibleCompanyCondition(),
			inArray(companies.departmentCode, input.departement),
		);
		if (departmentFilter) baseConditions.push(departmentFilter);
	}

	if (input.naf?.length) {
		const nafFilter = and(
			diffusibleCompanyCondition(),
			inArray(companies.nafCode, input.naf),
		);
		if (nafFilter) baseConditions.push(nafFilter);
	}

	if (input.year) {
		baseConditions.push(eq(representationDeclarations.year, input.year));
	}

	const where = and(...baseConditions);

	const [rows, countResult] = await Promise.all([
		db
			.select({
				...publicRepresentationColumns,
				...representationCompanyColumns,
			})
			.from(representationDeclarations)
			.innerJoin(
				companies,
				eq(representationDeclarations.siren, companies.siren),
			)
			.where(where)
			.orderBy(
				desc(representationDeclarations.year),
				asc(publicCompanyNameSortKey()),
				asc(companies.siren),
			)
			.limit(input.limit)
			.offset(input.offset),
		db
			.select({ total: count() })
			.from(representationDeclarations)
			.innerJoin(
				companies,
				eq(representationDeclarations.siren, companies.siren),
			)
			.where(where),
	]);

	const data = rows.map((row) =>
		toPublicRepresentation(row, toCompanySource(row)),
	);

	return {
		data,
		count: countResult[0]?.total ?? 0,
	};
}

async function fetchRows(siren: string, year?: number) {
	const yearFilter =
		year !== undefined ? eq(representationDeclarations.year, year) : undefined;

	return db
		.select({
			...publicRepresentationColumns,
			...representationCompanyColumns,
		})
		.from(representationDeclarations)
		.innerJoin(companies, eq(representationDeclarations.siren, companies.siren))
		.where(
			and(
				eq(representationDeclarations.siren, siren),
				submittedRepresentationCondition(),
				yearFilter,
			),
		)
		.orderBy(desc(representationDeclarations.year));
}

export async function getPublicRepresentationsBySiren(
	siren: string,
	limit?: number,
): Promise<PublicRepresentationDTO[]> {
	const rows = await fetchRows(siren);
	const limited = limit !== undefined ? rows.slice(0, limit) : rows;
	return limited.map((row) =>
		toPublicRepresentation(row, toCompanySource(row)),
	);
}

export async function getPublicRepresentationBySirenYear(
	siren: string,
	year: number,
): Promise<PublicRepresentationDTO | null> {
	const rows = await fetchRows(siren, year);
	const row = rows[0];
	if (!row) return null;

	return toPublicRepresentation(row, toCompanySource(row));
}
