import "server-only";

import { and, eq, gte, inArray, lt, or, sql } from "drizzle-orm";
import type { DB } from "~/server/db";
import { db } from "~/server/db";
import {
	notCancelledCondition,
	submittedDeclarationCondition,
} from "~/server/db/declarationConditions";
import {
	companies,
	cseOpinions,
	declarationStatusHistory,
	declarations,
	employeeCategories,
	files,
	gipMdsData,
	jobCategories,
	users,
} from "~/server/db/schema";
import type { CseRow, FileRow, IndicatorGEntry } from "./fetchDeclarations";
import type { IndicatorGRow } from "./types";

// postgres.js returns ISO strings (not Date) for raw `sql<>` aggregations like
// MAX(timestamptz) — the column-type metadata is lost. mapWith bridges that
// gap so callers can rely on a real Date | null.
const toDate = (value: unknown): Date | null =>
	value == null ? null : new Date(value as string | number | Date);

export type RawHistoryEntry = {
	eventType: string;
	value: string | null;
	round: number | null;
	createdAt: string;
};

function latestEventAt(eventType: string) {
	return sql<Date | null>`(
		SELECT MAX(${declarationStatusHistory.createdAt})
		FROM ${declarationStatusHistory}
		WHERE ${declarationStatusHistory.declarationId} = ${declarations.id}
		AND ${declarationStatusHistory.eventType} = ${eventType}
	)`.mapWith(toDate);
}

function latestPathChoiceAt(round: 1 | 2) {
	return sql<Date | null>`(
		SELECT MAX(${declarationStatusHistory.createdAt})
		FROM ${declarationStatusHistory}
		WHERE ${declarationStatusHistory.declarationId} = ${declarations.id}
		AND ${declarationStatusHistory.eventType} = 'path_choice'
		AND ${declarationStatusHistory.round} = ${round}
	)`.mapWith(toDate);
}

function statusHistoryArray() {
	return sql<RawHistoryEntry[]>`(
		SELECT COALESCE(
			json_agg(
				json_build_object(
					'eventType', ${declarationStatusHistory.eventType},
					'value', ${declarationStatusHistory.value},
					'round', ${declarationStatusHistory.round},
					'createdAt', to_char(
						${declarationStatusHistory.createdAt} AT TIME ZONE 'UTC',
						'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
					)
				)
				ORDER BY ${declarationStatusHistory.createdAt} ASC
			),
			'[]'::json
		)
		FROM ${declarationStatusHistory}
		WHERE ${declarationStatusHistory.declarationId} = ${declarations.id}
	)`.mapWith((value: unknown) =>
		Array.isArray(value) ? (value as RawHistoryEntry[]) : [],
	);
}

export const statusHistoryProjection = {
	submittedAt: latestEventAt("submit"),
	firstDeclarationPathChoiceAt: latestPathChoiceAt(1),
	secondDeclarationPathChoiceAt: latestPathChoiceAt(2),
	secondDeclarationSubmittedAt: latestEventAt("second_declaration_submit"),
	jointEvaluationSubmittedAt: latestEventAt("joint_evaluation_submit"),
	cseOpinionCompletedAt: latestEventAt("cse_opinion_submit"),
	demarcheCompletedAt: latestEventAt("demarche_complete"),
	statusHistoryArray: statusHistoryArray(),
};

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
	indicatorFHourlyWomen1: declarations.indicatorFHourlyWomen1,
	indicatorFHourlyWomen2: declarations.indicatorFHourlyWomen2,
	indicatorFHourlyWomen3: declarations.indicatorFHourlyWomen3,
	indicatorFHourlyWomen4: declarations.indicatorFHourlyWomen4,
	indicatorFHourlyMen1: declarations.indicatorFHourlyMen1,
	indicatorFHourlyMen2: declarations.indicatorFHourlyMen2,
	indicatorFHourlyMen3: declarations.indicatorFHourlyMen3,
	indicatorFHourlyMen4: declarations.indicatorFHourlyMen4,
	globalAnnualMeanGap: declarations.globalAnnualMeanGap,
	globalHourlyMeanGap: declarations.globalHourlyMeanGap,
	variableAnnualMeanGap: declarations.variableAnnualMeanGap,
	variableHourlyMeanGap: declarations.variableHourlyMeanGap,
	globalAnnualMedianGap: declarations.globalAnnualMedianGap,
	globalHourlyMedianGap: declarations.globalHourlyMedianGap,
	variableAnnualMedianGap: declarations.variableAnnualMedianGap,
	variableHourlyMedianGap: declarations.variableHourlyMedianGap,
	variableProportionWomen: declarations.variableProportionWomen,
	variableProportionMen: declarations.variableProportionMen,
	annualQuartile1ProportionWomen: declarations.annualQuartile1ProportionWomen,
	annualQuartile2ProportionWomen: declarations.annualQuartile2ProportionWomen,
	annualQuartile3ProportionWomen: declarations.annualQuartile3ProportionWomen,
	annualQuartile4ProportionWomen: declarations.annualQuartile4ProportionWomen,
	annualQuartile1ProportionMen: declarations.annualQuartile1ProportionMen,
	annualQuartile2ProportionMen: declarations.annualQuartile2ProportionMen,
	annualQuartile3ProportionMen: declarations.annualQuartile3ProportionMen,
	annualQuartile4ProportionMen: declarations.annualQuartile4ProportionMen,
	hourlyQuartile1ProportionWomen: declarations.hourlyQuartile1ProportionWomen,
	hourlyQuartile2ProportionWomen: declarations.hourlyQuartile2ProportionWomen,
	hourlyQuartile3ProportionWomen: declarations.hourlyQuartile3ProportionWomen,
	hourlyQuartile4ProportionWomen: declarations.hourlyQuartile4ProportionWomen,
	hourlyQuartile1ProportionMen: declarations.hourlyQuartile1ProportionMen,
	hourlyQuartile2ProportionMen: declarations.hourlyQuartile2ProportionMen,
	hourlyQuartile3ProportionMen: declarations.hourlyQuartile3ProportionMen,
	hourlyQuartile4ProportionMen: declarations.hourlyQuartile4ProportionMen,
};

// ── Shared select columns for export queries ────────────────────────

export const sharedExportColumns = {
	declarantFirstName: users.firstName,
	declarantLastName: users.lastName,
	declarantEmail: users.email,
	declarantPhone: users.phone,
	...indicatorColumns,
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
			firstDeclarationPathChoice: declarations.firstDeclarationPathChoice,
			secondDeclarationPathChoice: declarations.secondDeclarationPathChoice,
			totalWomen: declarations.totalWomen,
			totalMen: declarations.totalMen,
			cseRequired: declarations.cseRequired,
			rulesVersion: declarations.rulesVersion,
			secondDeclReferencePeriodStart:
				declarations.secondDeclReferencePeriodStart,
			secondDeclReferencePeriodEnd: declarations.secondDeclReferencePeriodEnd,
			createdAt: declarations.createdAt,
			updatedAt: declarations.updatedAt,
			cancelledAt: declarations.cancelledAt,
			declarationId: declarations.id,
			companyName: companies.name,
			workforceEma: gipMdsData.workforceEma,
			nafCode: companies.nafCode,
			address: companies.address,
			hasCse: companies.hasCse,
			...statusHistoryProjection,
			...sharedExportColumns,
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
		.innerJoin(users, eq(declarations.declarantId, users.id))
		.where(
			or(
				and(
					gte(declarations.cancelledAt, new Date(`${dateBegin}T00:00:00Z`)),
					lt(declarations.cancelledAt, new Date(`${dateEnd}T00:00:00Z`)),
				),
				and(
					submittedDeclarationCondition(),
					gte(declarations.updatedAt, new Date(`${dateBegin}T00:00:00Z`)),
					lt(declarations.updatedAt, new Date(`${dateEnd}T00:00:00Z`)),
					notCancelledCondition(),
				),
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
			source: jobCategories.source,
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
	database: DB = db,
): Promise<Map<string, CseRow[]>> {
	if (declarationIds.length === 0) return new Map();

	const rows = await database
		.select({
			declarationId: cseOpinions.declarationId,
			declarationNumber: cseOpinions.declarationNumber,
			type: cseOpinions.type,
			opinion: cseOpinions.opinion,
			opinionDate: cseOpinions.opinionDate,
		})
		.from(cseOpinions)
		.where(inArray(cseOpinions.declarationId, declarationIds));

	return groupByKey(rows, (r) => r.declarationId);
}

// ── Indicator G rows (for XLSX export) ──────────────────────────────

export async function buildIndicatorGRows(
	database: DB,
	year: number,
): Promise<IndicatorGRow[]> {
	return database
		.select({
			siren: declarations.siren,
			companyName: companies.name,
			year: declarations.year,
			declarationType: employeeCategories.declarationType,
			categoryIndex: jobCategories.categoryIndex,
			categoryName: jobCategories.name,
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
		.where(and(submittedDeclarationCondition(), eq(declarations.year, year)));
}

// ── Indicator G presence check ──────────────────────────────────────

export async function getDeclarationsWithIndicatorG(
	database: DB,
	declarationIds: string[],
): Promise<Set<string>> {
	if (declarationIds.length === 0) return new Set();

	const rows = await database
		.selectDistinct({ declarationId: jobCategories.declarationId })
		.from(jobCategories)
		.where(inArray(jobCategories.declarationId, declarationIds));

	return new Set(rows.map((r) => r.declarationId));
}

// ── File queries (CSE opinion files + joint evaluation files) ────────

async function fetchFilesByDeclaration(
	keys: Array<{ siren: string; year: number }>,
	type: "cse_opinion" | "joint_evaluation",
): Promise<FileRow[]> {
	if (keys.length === 0) return [];
	return db
		.select({
			id: files.id,
			siren: declarations.siren,
			year: declarations.year,
			fileName: files.fileName,
			filePath: files.filePath,
			uploadedAt: files.uploadedAt,
		})
		.from(files)
		.innerJoin(declarations, eq(files.declarationId, declarations.id))
		.where(
			and(
				eq(files.type, type),
				or(
					...keys.map((k) =>
						and(eq(declarations.siren, k.siren), eq(declarations.year, k.year)),
					),
				),
			),
		);
}

export async function fetchCseFilesByDeclaration(
	keys: Array<{ siren: string; year: number }>,
): Promise<Map<string, FileRow[]>> {
	if (keys.length === 0) return new Map();
	const rows = await fetchFilesByDeclaration(keys, "cse_opinion");
	return groupByKey(rows, (r) => `${r.siren}-${r.year}`);
}

export async function fetchJointEvaluationFilesByDeclaration(
	keys: Array<{ siren: string; year: number }>,
): Promise<Map<string, FileRow[]>> {
	if (keys.length === 0) return new Map();
	const rows = await fetchFilesByDeclaration(keys, "joint_evaluation");
	return groupByKey(rows, (r) => `${r.siren}-${r.year}`);
}

// ── Single file lookup (for download) ────────────────────────────────

export async function fetchFileById(
	fileId: string,
): Promise<{ filePath: string; fileName: string } | undefined> {
	const rows = await db
		.select({
			filePath: files.filePath,
			fileName: files.fileName,
		})
		.from(files)
		.where(eq(files.id, fileId))
		.limit(1);

	return rows[0];
}

/**
 * Fetch a file by ID, scoped to a specific SIREN.
 * Returns the file only if it belongs to a declaration owned by the given SIREN.
 */
export async function fetchFileBySiren(
	fileId: string,
	siren: string,
): Promise<{ filePath: string; fileName: string } | undefined> {
	const rows = await db
		.select({
			filePath: files.filePath,
			fileName: files.fileName,
		})
		.from(files)
		.innerJoin(declarations, eq(files.declarationId, declarations.id))
		.where(and(eq(files.id, fileId), eq(declarations.siren, siren)))
		.limit(1);

	return rows[0];
}
