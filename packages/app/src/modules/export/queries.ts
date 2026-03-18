import "server-only";

import { and, eq, gte, inArray, lt, or } from "drizzle-orm";

import { db } from "~/server/db";
import {
	companies,
	cseOpinions,
	declarationCategories,
	declarations,
	employeeCategories,
	jobCategories,
	users,
} from "~/server/db/schema";
import type { CategoryRow, CseRow, IndicatorGEntry } from "./fetchDeclarations";

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
		})
		.from(declarations)
		.innerJoin(companies, eq(declarations.siren, companies.siren))
		.innerJoin(users, eq(declarations.declarantId, users.id))
		.where(
			and(
				eq(declarations.status, "submitted"),
				// Timestamps are stored in UTC (withTimezone: true)
				gte(declarations.updatedAt, new Date(`${dateBegin}T00:00:00Z`)),
				lt(declarations.updatedAt, new Date(`${dateEnd}T00:00:00Z`)),
			),
		);
}

// ── Indicators A–F (declarationCategories, steps 2–4) ────────────────

export async function fetchCategoriesByDeclaration(
	keys: Array<{ siren: string; year: number }>,
): Promise<Map<string, CategoryRow[]>> {
	if (keys.length === 0) return new Map();

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
			womenMedianValue: declarationCategories.womenMedianValue,
			menMedianValue: declarationCategories.menMedianValue,
		})
		.from(declarationCategories)
		.where(
			or(
				...keys.map((k) =>
					and(
						eq(declarationCategories.siren, k.siren),
						eq(declarationCategories.year, k.year),
					),
				),
			),
		);

	return groupByKey(rows, (r) => `${r.siren}-${r.year}`);
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
	keys: Array<{ siren: string; year: number }>,
): Promise<Map<string, CseRow[]>> {
	if (keys.length === 0) return new Map();

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
			or(
				...keys.map((k) =>
					and(eq(cseOpinions.siren, k.siren), eq(cseOpinions.year, k.year)),
				),
			),
		);

	return groupByKey(rows, (r) => `${r.siren}-${r.year}`);
}
