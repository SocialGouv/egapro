import "server-only";

import { and, eq, gte, inArray, lt, or } from "drizzle-orm";

import { db } from "~/server/db";
import {
	companies,
	cseOpinionFiles,
	cseOpinions,
	declarations,
	employeeCategories,
	jobCategories,
	jointEvaluationFiles,
	users,
} from "~/server/db/schema";
import type { CseRow, FileRow, IndicatorGEntry } from "./fetchDeclarations";

// ── Shared select columns for indicators A–F ───────────────────────

export const indicatorColumns = {
	indicatorAAnnualWomen: declarations.indicatorAAnnualWomen,
	indicatorAAnnualMen: declarations.indicatorAAnnualMen,
	indicatorAHourlyWomen: declarations.indicatorAHourlyWomen,
	indicatorAHourlyMen: declarations.indicatorAHourlyMen,
	indicatorBAnnualWomen: declarations.indicatorBAnnualWomen,
	indicatorBAnnualMen: declarations.indicatorBAnnualMen,
	indicatorBHourlyWomen: declarations.indicatorBHourlyWomen,
	indicatorBHourlyMen: declarations.indicatorBHourlyMen,
	indicatorCAnnualWomen: declarations.indicatorCAnnualWomen,
	indicatorCAnnualMen: declarations.indicatorCAnnualMen,
	indicatorCHourlyWomen: declarations.indicatorCHourlyWomen,
	indicatorCHourlyMen: declarations.indicatorCHourlyMen,
	indicatorDAnnualWomen: declarations.indicatorDAnnualWomen,
	indicatorDAnnualMen: declarations.indicatorDAnnualMen,
	indicatorDHourlyWomen: declarations.indicatorDHourlyWomen,
	indicatorDHourlyMen: declarations.indicatorDHourlyMen,
	indicatorEWomen: declarations.indicatorEWomen,
	indicatorEMen: declarations.indicatorEMen,
	indicatorFAnnualThreshold1: declarations.indicatorFAnnualThreshold1,
	indicatorFAnnualThreshold2: declarations.indicatorFAnnualThreshold2,
	indicatorFAnnualThreshold3: declarations.indicatorFAnnualThreshold3,
	indicatorFAnnualThreshold4: declarations.indicatorFAnnualThreshold4,
	indicatorFAnnualWomen1: declarations.indicatorFAnnualWomen1,
	indicatorFAnnualWomen2: declarations.indicatorFAnnualWomen2,
	indicatorFAnnualWomen3: declarations.indicatorFAnnualWomen3,
	indicatorFAnnualWomen4: declarations.indicatorFAnnualWomen4,
	indicatorFAnnualMen1: declarations.indicatorFAnnualMen1,
	indicatorFAnnualMen2: declarations.indicatorFAnnualMen2,
	indicatorFAnnualMen3: declarations.indicatorFAnnualMen3,
	indicatorFAnnualMen4: declarations.indicatorFAnnualMen4,
	indicatorFHourlyThreshold1: declarations.indicatorFHourlyThreshold1,
	indicatorFHourlyThreshold2: declarations.indicatorFHourlyThreshold2,
	indicatorFHourlyThreshold3: declarations.indicatorFHourlyThreshold3,
	indicatorFHourlyThreshold4: declarations.indicatorFHourlyThreshold4,
	indicatorFHourlyWomen1: declarations.indicatorFHourlyWomen1,
	indicatorFHourlyWomen2: declarations.indicatorFHourlyWomen2,
	indicatorFHourlyWomen3: declarations.indicatorFHourlyWomen3,
	indicatorFHourlyWomen4: declarations.indicatorFHourlyWomen4,
	indicatorFHourlyMen1: declarations.indicatorFHourlyMen1,
	indicatorFHourlyMen2: declarations.indicatorFHourlyMen2,
	indicatorFHourlyMen3: declarations.indicatorFHourlyMen3,
	indicatorFHourlyMen4: declarations.indicatorFHourlyMen4,
};

// ── Shared helper ────────────────────────────────────────────────────

function groupByKey<T>(rows: T[], keyFn: (row: T) => string): Map<string, T[]> {
	const map = new Map<string, T[]>();
	for (const row of rows) {
		const key = keyFn(row);
		const existing = map.get(key) ?? [];
		existing.push(row);
		map.set(key, existing);
	}
	return map;
}

// ── Main query ───────────────────────────────────────────────────────

export type DeclarationRow = Awaited<
	ReturnType<typeof fetchSubmittedDeclarations>
>[number];

export async function fetchSubmittedDeclarations(
	dateBegin: string,
	dateEnd: string,
) {
	return db
		.select({
			siren: declarations.siren,
			year: declarations.year,
			status: declarations.status,
			compliancePath: declarations.compliancePath,
			totalWomen: declarations.totalWomen,
			totalMen: declarations.totalMen,
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
			...indicatorColumns,
		})
		.from(declarations)
		.innerJoin(companies, eq(declarations.siren, companies.siren))
		.innerJoin(users, eq(declarations.declarantId, users.id))
		.where(
			and(
				eq(declarations.status, "submitted"),
				gte(declarations.updatedAt, new Date(`${dateBegin}T00:00:00Z`)),
				lt(declarations.updatedAt, new Date(`${dateEnd}T00:00:00Z`)),
			),
		);
}

// ── Indicator G (jobCategories + employeeCategories) ─────────────────

export async function fetchIndicatorGByDeclaration(
	declarationIds: string[],
): Promise<Map<string, IndicatorGEntry[]>> {
	if (declarationIds.length === 0) return new Map();

	const rows = await db
		.select({
			declarationId: jobCategories.declarationId,
			categoryName: jobCategories.name,
			detail: jobCategories.detail,
			declarationType: employeeCategories.declarationType,
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
		.from(jobCategories)
		.innerJoin(
			employeeCategories,
			eq(jobCategories.id, employeeCategories.jobCategoryId),
		)
		.where(inArray(jobCategories.declarationId, declarationIds));

	return groupByKey(rows, (r) => r.declarationId);
}

// ── CSE opinions ─────────────────────────────────────────────────────

export async function fetchCseOpinionsByDeclaration(
	declarationIds: string[],
): Promise<Map<string, CseRow[]>> {
	if (declarationIds.length === 0) return new Map();

	const rows = await db
		.select({
			declarationId: cseOpinions.declarationId,
			type: cseOpinions.type,
			opinion: cseOpinions.opinion,
			opinionDate: cseOpinions.opinionDate,
		})
		.from(cseOpinions)
		.where(inArray(cseOpinions.declarationId, declarationIds));

	return groupByKey(rows, (r) => r.declarationId);
}

// ── CSE opinion files ────────────────────────────────────────────────

export async function fetchCseFilesByDeclaration(
	keys: Array<{ siren: string; year: number }>,
): Promise<Map<string, FileRow[]>> {
	if (keys.length === 0) return new Map();

	const rows = await db
		.select({
			id: cseOpinionFiles.id,
			siren: declarations.siren,
			year: declarations.year,
			fileName: cseOpinionFiles.fileName,
			filePath: cseOpinionFiles.filePath,
			uploadedAt: cseOpinionFiles.uploadedAt,
		})
		.from(cseOpinionFiles)
		.innerJoin(declarations, eq(cseOpinionFiles.declarationId, declarations.id))
		.where(
			or(
				...keys.map((k) =>
					and(eq(declarations.siren, k.siren), eq(declarations.year, k.year)),
				),
			),
		);

	return groupByKey(rows, (r) => `${r.siren}-${r.year}`);
}

// ── Joint evaluation files ───────────────────────────────────────────

export async function fetchJointEvaluationFilesByDeclaration(
	keys: Array<{ siren: string; year: number }>,
): Promise<Map<string, FileRow[]>> {
	if (keys.length === 0) return new Map();

	const rows = await db
		.select({
			id: jointEvaluationFiles.id,
			siren: declarations.siren,
			year: declarations.year,
			fileName: jointEvaluationFiles.fileName,
			filePath: jointEvaluationFiles.filePath,
			uploadedAt: jointEvaluationFiles.uploadedAt,
		})
		.from(jointEvaluationFiles)
		.innerJoin(
			declarations,
			eq(jointEvaluationFiles.declarationId, declarations.id),
		)
		.where(
			or(
				...keys.map((k) =>
					and(eq(declarations.siren, k.siren), eq(declarations.year, k.year)),
				),
			),
		);

	return groupByKey(rows, (r) => `${r.siren}-${r.year}`);
}

// ── Single file lookup (for download) ────────────────────────────────

export async function fetchFileById(
	fileId: string,
): Promise<{ filePath: string; fileName: string } | undefined> {
	const cseRows = await db
		.select({
			filePath: cseOpinionFiles.filePath,
			fileName: cseOpinionFiles.fileName,
		})
		.from(cseOpinionFiles)
		.where(eq(cseOpinionFiles.id, fileId))
		.limit(1);

	if (cseRows[0]) return cseRows[0];

	const jointRows = await db
		.select({
			filePath: jointEvaluationFiles.filePath,
			fileName: jointEvaluationFiles.fileName,
		})
		.from(jointEvaluationFiles)
		.where(eq(jointEvaluationFiles.id, fileId))
		.limit(1);

	return jointRows[0];
}
