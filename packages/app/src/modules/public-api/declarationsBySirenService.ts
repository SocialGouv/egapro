import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { isYearPubliclyReleased } from "~/modules/domain";
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
import type {
	PublicCompanySource,
	PublicDeclarationSource,
} from "./projection";
import { publicDeclarationColumns, toPublicDeclaration } from "./projection";
import type { PublicDeclarationDTO } from "./schemas";

type DeclarationRow = {
	declaration: PublicDeclarationSource;
	company: PublicCompanySource;
	publicDataReleaseDate: string | null;
};

async function fetchRows(
	siren: string,
	year?: number,
): Promise<DeclarationRow[]> {
	const yearFilter =
		year !== undefined ? eq(declarations.year, year) : undefined;

	const rows = await db
		.select({
			...publicDeclarationColumns,
			companySiren: companies.siren,
			companyName: companies.name,
			companyAddress: companies.address,
			companyRegion: companies.region,
			companyDepartmentCode: companies.departmentCode,
			companyDepartmentLabel: companies.departmentLabel,
			companyNafCode: companies.nafCode,
			companyNafLabel: companies.nafLabel,
			workforceEma: gipMdsData.workforceEma,
			publicDataReleaseDate: campaignDeadlines.publicDataReleaseDate,
		})
		.from(declarations)
		.innerJoin(companies, eq(declarations.siren, companies.siren))
		.leftJoin(
			gipMdsData,
			and(
				eq(gipMdsData.siren, declarations.siren),
				eq(gipMdsData.year, declarations.year),
			),
		)
		.leftJoin(campaignDeadlines, eq(campaignDeadlines.year, declarations.year))
		.where(
			and(
				eq(declarations.siren, siren),
				notCancelledCondition(),
				submittedDeclarationCondition(),
				yearFilter,
			),
		)
		.orderBy(desc(declarations.year));

	return rows.map((row) => ({
		declaration: row,
		company: {
			siren: row.companySiren,
			name: row.companyName,
			address: row.companyAddress ?? null,
			region: row.companyRegion ?? null,
			departmentCode: row.companyDepartmentCode ?? null,
			departmentLabel: row.companyDepartmentLabel ?? null,
			nafCode: row.companyNafCode ?? null,
			nafLabel: row.companyNafLabel ?? null,
			statutDiffusion: null,
			workforceEma: row.workforceEma ?? null,
		},
		publicDataReleaseDate: row.publicDataReleaseDate ?? null,
	}));
}

function isReleased(
	publicDataReleaseDate: string | null,
	today: Date,
): boolean {
	const releaseDate = publicDataReleaseDate
		? new Date(`${publicDataReleaseDate}T00:00:00`)
		: null;
	return isYearPubliclyReleased(releaseDate, today);
}

export async function getPublicDeclarationsBySiren(
	siren: string,
	limit?: number,
): Promise<PublicDeclarationDTO[]> {
	const rows = await fetchRows(siren);
	const today = new Date();

	const released = rows.filter((r) =>
		isReleased(r.publicDataReleaseDate, today),
	);
	const limited = limit !== undefined ? released.slice(0, limit) : released;
	return limited.map((r) => toPublicDeclaration(r.declaration, r.company));
}

export async function getPublicDeclarationBySirenYear(
	siren: string,
	year: number,
): Promise<PublicDeclarationDTO | null> {
	const rows = await fetchRows(siren, year);
	const row = rows[0];
	if (!row) return null;

	const today = new Date();
	if (!isReleased(row.publicDataReleaseDate, today)) return null;

	return toPublicDeclaration(row.declaration, row.company);
}
