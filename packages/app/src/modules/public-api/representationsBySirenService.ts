import "server-only";

import { and, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "~/server/db";
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
		const term = `%${input.q}%`;
		const queryFilter = or(
			ilike(companies.name, term),
			ilike(representationDeclarations.siren, term),
		);
		if (queryFilter) baseConditions.push(queryFilter);
	}

	if (input.region?.length) {
		baseConditions.push(inArray(companies.region, input.region));
	}

	if (input.departement?.length) {
		baseConditions.push(inArray(companies.departmentCode, input.departement));
	}

	if (input.naf?.length) {
		baseConditions.push(inArray(companies.nafCode, input.naf));
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
			.orderBy(desc(representationDeclarations.year))
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
