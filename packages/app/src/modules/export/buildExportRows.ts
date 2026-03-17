import "server-only";

import { and, eq, sql } from "drizzle-orm";

import type { DB } from "~/server/db";
import {
	companies,
	cseOpinions,
	declarations,
	jobCategories,
	users,
} from "~/server/db/schema";
import type { ExportRow } from "./types";

/**
 * Query all submitted declarations for a given date (created or updated that day)
 * and flatten them into ExportRow objects ready for CSV generation.
 */
export async function buildExportRows(
	db: DB,
	date: string,
): Promise<ExportRow[]> {
	const nextDate = getNextDate(date);

	const rows = await db
		.select({
			// Declaration
			siren: declarations.siren,
			year: declarations.year,
			status: declarations.status,
			compliancePath: declarations.compliancePath,
			totalWomen: declarations.totalWomen,
			totalMen: declarations.totalMen,
			remunerationScore: declarations.remunerationScore,
			variableRemunerationScore: declarations.variableRemunerationScore,
			quartileScore: declarations.quartileScore,
			categoryScore: declarations.categoryScore,
			secondDeclarationStatus: declarations.secondDeclarationStatus,
			secondDeclReferencePeriodStart:
				declarations.secondDeclReferencePeriodStart,
			secondDeclReferencePeriodEnd: declarations.secondDeclReferencePeriodEnd,
			createdAt: declarations.createdAt,
			updatedAt: declarations.updatedAt,
			declarationId: declarations.id,
			// Company
			companyName: companies.name,
			workforce: companies.workforce,
			nafCode: companies.nafCode,
			address: companies.address,
			hasCse: companies.hasCse,
			// Declarant
			declarantFirstName: users.firstName,
			declarantLastName: users.lastName,
			declarantEmail: users.email,
			declarantPhone: users.phone,
		})
		.from(declarations)
		.innerJoin(companies, eq(declarations.siren, companies.siren))
		.innerJoin(users, eq(declarations.declarantId, users.id))
		.where(
			and(
				eq(declarations.status, "submitted"),
				sql`(${declarations.updatedAt} >= ${date}::timestamptz AND ${declarations.updatedAt} < ${nextDate}::timestamptz)`,
			),
		);

	const declarationIds = rows.map((r) => r.declarationId);
	const hasIndicatorG = await getDeclarationsWithIndicatorG(db, declarationIds);

	const cseMap = await getCseOpinionsByDeclaration(
		db,
		rows.map((r) => ({ siren: r.siren, year: r.year })),
	);

	return rows.map((row) => ({
		siren: row.siren,
		companyName: row.companyName,
		workforce: row.workforce,
		nafCode: row.nafCode,
		address: row.address,
		hasCse: row.hasCse,
		year: row.year,
		status: row.status,
		declarationType: hasIndicatorG.has(row.declarationId)
			? "7_indicateurs"
			: "6_indicateurs",
		compliancePath: row.compliancePath,
		createdAt: row.createdAt?.toISOString() ?? null,
		updatedAt: row.updatedAt?.toISOString() ?? null,
		totalWomen: row.totalWomen,
		totalMen: row.totalMen,
		remunerationScore: row.remunerationScore,
		variableRemunerationScore: row.variableRemunerationScore,
		quartileScore: row.quartileScore,
		categoryScore: row.categoryScore,
		secondDeclarationStatus: row.secondDeclarationStatus,
		secondDeclReferencePeriodStart: row.secondDeclReferencePeriodStart,
		secondDeclReferencePeriodEnd: row.secondDeclReferencePeriodEnd,
		declarantFirstName: row.declarantFirstName,
		declarantLastName: row.declarantLastName,
		declarantEmail: row.declarantEmail,
		declarantPhone: row.declarantPhone,
		...mapCseOpinions(cseMap.get(`${row.siren}-${row.year}`) ?? []),
	}));
}

function getNextDate(date: string): string {
	const d = new Date(`${date}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() + 1);
	return d.toISOString().slice(0, 10);
}

async function getDeclarationsWithIndicatorG(
	db: DB,
	declarationIds: string[],
): Promise<Set<string>> {
	if (declarationIds.length === 0) return new Set();

	const rows = await db
		.selectDistinct({ declarationId: jobCategories.declarationId })
		.from(jobCategories)
		.where(sql`${jobCategories.declarationId} IN ${declarationIds}`);

	return new Set(rows.map((r) => r.declarationId));
}

type CseOpinionRow = {
	type: string;
	opinion: string | null;
	opinionDate: string | null;
};

async function getCseOpinionsByDeclaration(
	db: DB,
	keys: Array<{ siren: string; year: number }>,
): Promise<Map<string, CseOpinionRow[]>> {
	if (keys.length === 0) return new Map();

	const uniqueSirens = [...new Set(keys.map((k) => k.siren))];
	const uniqueYears = [...new Set(keys.map((k) => k.year))];

	const rows = await db
		.select({
			siren: cseOpinions.siren,
			year: cseOpinions.year,
			type: cseOpinions.type,
			opinion: cseOpinions.opinion,
			opinionDate: cseOpinions.opinionDate,
		})
		.from(cseOpinions)
		.where(
			and(
				sql`${cseOpinions.siren} IN ${uniqueSirens}`,
				sql`${cseOpinions.year} IN ${uniqueYears}`,
			),
		);

	const map = new Map<string, CseOpinionRow[]>();
	for (const row of rows) {
		const key = `${row.siren}-${row.year}`;
		const existing = map.get(key) ?? [];
		existing.push({
			type: row.type,
			opinion: row.opinion,
			opinionDate: row.opinionDate,
		});
		map.set(key, existing);
	}
	return map;
}

type CseFields = Pick<
	ExportRow,
	| "cseOpinion1Type"
	| "cseOpinion1Opinion"
	| "cseOpinion1Date"
	| "cseOpinion2Type"
	| "cseOpinion2Opinion"
	| "cseOpinion2Date"
	| "cseOpinion3Type"
	| "cseOpinion3Opinion"
	| "cseOpinion3Date"
	| "cseOpinion4Type"
	| "cseOpinion4Opinion"
	| "cseOpinion4Date"
>;

function mapCseOpinions(opinions: CseOpinionRow[]): CseFields {
	return {
		cseOpinion1Type: opinions[0]?.type ?? null,
		cseOpinion1Opinion: opinions[0]?.opinion ?? null,
		cseOpinion1Date: opinions[0]?.opinionDate ?? null,
		cseOpinion2Type: opinions[1]?.type ?? null,
		cseOpinion2Opinion: opinions[1]?.opinion ?? null,
		cseOpinion2Date: opinions[1]?.opinionDate ?? null,
		cseOpinion3Type: opinions[2]?.type ?? null,
		cseOpinion3Opinion: opinions[2]?.opinion ?? null,
		cseOpinion3Date: opinions[2]?.opinionDate ?? null,
		cseOpinion4Type: opinions[3]?.type ?? null,
		cseOpinion4Opinion: opinions[3]?.opinion ?? null,
		cseOpinion4Date: opinions[3]?.opinionDate ?? null,
	};
}
