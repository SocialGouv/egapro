import { and, eq, inArray, or } from "drizzle-orm";

import type { DB } from "~/server/db";
import {
	companies,
	cseOpinions,
	declarationCategories,
	declarations,
	employeeCategories,
	jobCategories,
	users,
} from "~/server/db/schema";
import type { CategoryRow, CseOpinionRow } from "./mapIndicators";
import {
	mapCseOpinions,
	mapIndicatorA,
	mapIndicatorB,
	mapIndicatorF,
} from "./mapIndicators";
import type { ExportRow, IndicatorGRow } from "./types";

/**
 * Query all submitted declarations for a given year
 * and flatten them into ExportRow objects ready for XLSX generation.
 */
export async function buildExportRows(
	db: DB,
	year: number,
): Promise<ExportRow[]> {
	const rows = await db
		.select({
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
			companyName: companies.name,
			workforce: companies.workforce,
			nafCode: companies.nafCode,
			address: companies.address,
			hasCse: companies.hasCse,
			declarantFirstName: users.firstName,
			declarantLastName: users.lastName,
			declarantEmail: users.email,
			declarantPhone: users.phone,
		})
		.from(declarations)
		.innerJoin(companies, eq(declarations.siren, companies.siren))
		.innerJoin(users, eq(declarations.declarantId, users.id))
		.where(
			and(eq(declarations.status, "submitted"), eq(declarations.year, year)),
		);

	const declarationIds = rows.map((r) => r.declarationId);
	const hasIndicatorG = await getDeclarationsWithIndicatorG(db, declarationIds);

	const sirenYears = rows.map((r) => ({ siren: r.siren, year: r.year }));
	const cseMap = await getCseOpinionsByDeclaration(db, sirenYears);
	const categoriesMap = await getCategoriesByDeclaration(db, sirenYears);

	return rows.map((row) => {
		const key = `${row.siren}-${row.year}`;
		const categories = categoriesMap.get(key) ?? [];

		return {
			siren: row.siren,
			companyName: row.companyName,
			workforce: row.workforce,
			nafCode: row.nafCode,
			address: row.address,
			hasCse: row.hasCse,
			year: row.year,
			status: row.status,
			declarationType: hasIndicatorG.has(row.declarationId)
				? ("7_indicateurs" as const)
				: ("6_indicateurs" as const),
			compliancePath: row.compliancePath,
			createdAt: row.createdAt?.toISOString() ?? null,
			updatedAt: row.updatedAt?.toISOString() ?? null,
			totalWomen: row.totalWomen,
			totalMen: row.totalMen,
			remunerationScore: row.remunerationScore,
			variableRemunerationScore: row.variableRemunerationScore,
			quartileScore: row.quartileScore,
			categoryScore: row.categoryScore,
			...mapIndicatorA(categories),
			...mapIndicatorB(categories),
			...mapIndicatorF(categories),
			secondDeclarationStatus: row.secondDeclarationStatus,
			secondDeclReferencePeriodStart: row.secondDeclReferencePeriodStart,
			secondDeclReferencePeriodEnd: row.secondDeclReferencePeriodEnd,
			declarantFirstName: row.declarantFirstName,
			declarantLastName: row.declarantLastName,
			declarantEmail: row.declarantEmail,
			declarantPhone: row.declarantPhone,
			...mapCseOpinions(cseMap.get(key) ?? []),
		};
	});
}

/**
 * Query all indicator G data (job categories + employee categories)
 * for submitted declarations of a given year.
 */
export async function buildIndicatorGRows(
	db: DB,
	year: number,
): Promise<IndicatorGRow[]> {
	const rows = await db
		.select({
			siren: declarations.siren,
			companyName: companies.name,
			year: declarations.year,
			declarationType: employeeCategories.declarationType,
			categoryIndex: jobCategories.categoryIndex,
			categoryName: jobCategories.name,
			categoryDetail: jobCategories.detail,
			categorySource: jobCategories.source,
			womenCount: employeeCategories.womenCount,
			menCount: employeeCategories.menCount,
			annualBaseWomen: employeeCategories.annualBaseWomen,
			annualBaseMen: employeeCategories.annualBaseMen,
			annualVariableWomen: employeeCategories.annualVariableWomen,
			annualVariableMen: employeeCategories.annualVariableMen,
			hourlyBaseWomen: employeeCategories.hourlyBaseWomen,
			hourlyBaseMen: employeeCategories.hourlyBaseMen,
			hourlyVariableWomen: employeeCategories.hourlyVariableWomen,
			hourlyVariableMen: employeeCategories.hourlyVariableMen,
		})
		.from(declarations)
		.innerJoin(companies, eq(declarations.siren, companies.siren))
		.innerJoin(jobCategories, eq(jobCategories.declarationId, declarations.id))
		.innerJoin(
			employeeCategories,
			eq(employeeCategories.jobCategoryId, jobCategories.id),
		)
		.where(
			and(eq(declarations.status, "submitted"), eq(declarations.year, year)),
		);

	return rows;
}

// ── DB queries ───────────────────────────────────────────────────────

async function getDeclarationsWithIndicatorG(
	db: DB,
	declarationIds: string[],
): Promise<Set<string>> {
	if (declarationIds.length === 0) return new Set();

	const rows = await db
		.selectDistinct({ declarationId: jobCategories.declarationId })
		.from(jobCategories)
		.where(inArray(jobCategories.declarationId, declarationIds));

	return new Set(rows.map((r) => r.declarationId));
}

async function getCategoriesByDeclaration(
	db: DB,
	keys: Array<{ siren: string; year: number }>,
): Promise<Map<string, CategoryRow[]>> {
	if (keys.length === 0) return new Map();

	const pairConditions = keys.map((k) =>
		and(
			eq(declarationCategories.siren, k.siren),
			eq(declarationCategories.year, k.year),
		),
	);

	const rows = await db
		.select({
			siren: declarationCategories.siren,
			year: declarationCategories.year,
			step: declarationCategories.step,
			categoryName: declarationCategories.categoryName,
			womenCount: declarationCategories.womenCount,
			menCount: declarationCategories.menCount,
			womenValue: declarationCategories.womenValue,
			menValue: declarationCategories.menValue,
		})
		.from(declarationCategories)
		.where(
			and(
				or(...pairConditions),
				inArray(declarationCategories.step, [2, 3, 4]),
			),
		);

	const map = new Map<string, CategoryRow[]>();
	for (const row of rows) {
		const key = `${row.siren}-${row.year}`;
		const existing = map.get(key) ?? [];
		existing.push(row);
		map.set(key, existing);
	}
	return map;
}

async function getCseOpinionsByDeclaration(
	db: DB,
	keys: Array<{ siren: string; year: number }>,
): Promise<Map<string, CseOpinionRow[]>> {
	if (keys.length === 0) return new Map();

	const pairConditions = keys.map((k) =>
		and(eq(cseOpinions.siren, k.siren), eq(cseOpinions.year, k.year)),
	);

	const rows = await db
		.select({
			siren: cseOpinions.siren,
			year: cseOpinions.year,
			type: cseOpinions.type,
			opinion: cseOpinions.opinion,
			opinionDate: cseOpinions.opinionDate,
		})
		.from(cseOpinions)
		.where(or(...pairConditions));

	const map = new Map<string, CseOpinionRow[]>();
	for (const row of rows) {
		const key = `${row.siren}-${row.year}`;
		const existing = map.get(key) ?? [];
		existing.push(row);
		map.set(key, existing);
	}
	return map;
}
