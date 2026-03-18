import { and, eq, gte, lt, sql } from "drizzle-orm";
import { z } from "zod";

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

const querySchema = z.object({
	date_begin: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "date_begin must be YYYY-MM-DD format"),
	date_end: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "date_end must be YYYY-MM-DD format")
		.optional(),
});

/**
 * GET /api/v1/export/declarations?date_begin=YYYY-MM-DD&date_end=YYYY-MM-DD
 *
 * Public REST API returning submitted declarations as JSON.
 * Includes all indicators (A, B, F, G) for each declaration.
 * - date_begin (required): start date (inclusive), filters on submission date (updatedAt)
 * - date_end (optional): end date (exclusive). If omitted, returns only date_begin day.
 */
export async function GET(request: Request) {
	try {
		const url = new URL(request.url);
		const parsed = querySchema.safeParse({
			date_begin: url.searchParams.get("date_begin") ?? undefined,
			date_end: url.searchParams.get("date_end") ?? undefined,
		});

		if (!parsed.success) {
			return Response.json(
				{
					error: "Le paramètre 'date_begin' est requis au format YYYY-MM-DD",
					details: parsed.error.issues,
				},
				{ status: 400 },
			);
		}

		const { date_begin } = parsed.data;
		const dateEnd = parsed.data.date_end ?? getNextDate(date_begin);

		const rows = await db
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
					gte(declarations.updatedAt, new Date(`${date_begin}T00:00:00Z`)),
					lt(declarations.updatedAt, new Date(`${dateEnd}T00:00:00Z`)),
				),
			);

		const sirenYearKeys = rows.map((r) => ({ siren: r.siren, year: r.year }));
		const declarationIds = rows.map((r) => r.declarationId);

		const [categoriesMap, indicatorGMap, cseMap] = await Promise.all([
			getCategoriesByDeclaration(sirenYearKeys),
			getIndicatorGByDeclaration(declarationIds),
			getCseOpinionsByDeclaration(sirenYearKeys),
		]);

		const data = rows.map((row) => {
			const key = `${row.siren}-${row.year}`;
			const categories = categoriesMap.get(key) ?? [];
			const indicatorG = indicatorGMap.get(row.declarationId) ?? [];
			const opinions = cseMap.get(key) ?? [];

			return {
				siren: row.siren,
				companyName: row.companyName,
				workforce: row.workforce,
				nafCode: row.nafCode,
				address: row.address,
				hasCse: row.hasCse,
				year: row.year,
				status: row.status,
				compliancePath: row.compliancePath,
				createdAt: row.createdAt?.toISOString() ?? null,
				updatedAt: row.updatedAt?.toISOString() ?? null,
				totalWomen: row.totalWomen,
				totalMen: row.totalMen,
				indicators: buildIndicators(categories),
				indicatorG: indicatorG.length > 0 ? indicatorG : null,
				secondDeclaration: {
					status: row.secondDeclarationStatus,
					referencePeriodStart: row.secondDeclReferencePeriodStart,
					referencePeriodEnd: row.secondDeclReferencePeriodEnd,
				},
				declarant: {
					firstName: row.declarantFirstName,
					lastName: row.declarantLastName,
					email: row.declarantEmail,
					phone: row.declarantPhone,
				},
				cseOpinions: opinions.map((o) => ({
					type: o.type,
					opinion: o.opinion,
					date: o.opinionDate,
				})),
			};
		});

		return Response.json({
			dateBegin: date_begin,
			dateEnd: dateEnd,
			count: data.length,
			declarations: data,
		});
	} catch (error) {
		console.error("[api/v1/export/declarations]", error);
		return Response.json(
			{ error: "Erreur lors de la récupération des déclarations" },
			{ status: 500 },
		);
	}
}

function getNextDate(date: string): string {
	const d = new Date(`${date}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() + 1);
	return d.toISOString().slice(0, 10);
}

// ── Indicator A (step 2), B (step 3), F (step 4) ────────────────────

type CategoryRow = {
	step: number;
	categoryName: string;
	womenCount: number | null;
	menCount: number | null;
	womenValue: string | null;
	menValue: string | null;
	womenMedianValue: string | null;
	menMedianValue: string | null;
};

async function getCategoriesByDeclaration(
	keys: Array<{ siren: string; year: number }>,
): Promise<Map<string, CategoryRow[]>> {
	if (keys.length === 0) return new Map();

	const uniqueSirens = [...new Set(keys.map((k) => k.siren))];
	const uniqueYears = [...new Set(keys.map((k) => k.year))];

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
			and(
				sql`${declarationCategories.siren} IN ${uniqueSirens}`,
				sql`${declarationCategories.year} IN ${uniqueYears}`,
			),
		);

	const map = new Map<string, CategoryRow[]>();
	for (const row of rows) {
		const key = `${row.siren}-${row.year}`;
		const existing = map.get(key) ?? [];
		existing.push({
			step: row.step,
			categoryName: row.categoryName,
			womenCount: row.womenCount,
			menCount: row.menCount,
			womenValue: row.womenValue,
			menValue: row.menValue,
			womenMedianValue: row.womenMedianValue,
			menMedianValue: row.menMedianValue,
		});
		map.set(key, existing);
	}
	return map;
}

function buildIndicators(categories: CategoryRow[]) {
	const byStep = (step: number) => categories.filter((c) => c.step === step);

	return {
		A: byStep(2).map((c) => ({
			category: c.categoryName,
			womenValue: c.womenValue,
			menValue: c.menValue,
		})),
		B: byStep(3).map((c) => ({
			category: c.categoryName,
			womenValue: c.womenValue,
			menValue: c.menValue,
		})),
		F: byStep(4).map((c) => ({
			category: c.categoryName,
			womenCount: c.womenCount,
			menCount: c.menCount,
			womenValue: c.womenValue,
		})),
	};
}

// ── Indicator G (job categories + employee categories) ───────────────

type IndicatorGEntry = {
	categoryName: string;
	detail: string | null;
	declarationType: string;
	womenCount: number | null;
	menCount: number | null;
	annualBaseWomen: string | null;
	annualBaseMen: string | null;
	annualVariableWomen: string | null;
	annualVariableMen: string | null;
	hourlyBaseWomen: string | null;
	hourlyBaseMen: string | null;
	hourlyVariableWomen: string | null;
	hourlyVariableMen: string | null;
};

async function getIndicatorGByDeclaration(
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
		.where(sql`${jobCategories.declarationId} IN ${declarationIds}`);

	const map = new Map<string, IndicatorGEntry[]>();
	for (const row of rows) {
		const existing = map.get(row.declarationId) ?? [];
		existing.push({
			categoryName: row.categoryName,
			detail: row.detail,
			declarationType: row.declarationType,
			womenCount: row.womenCount,
			menCount: row.menCount,
			annualBaseWomen: row.annualBaseWomen,
			annualBaseMen: row.annualBaseMen,
			annualVariableWomen: row.annualVariableWomen,
			annualVariableMen: row.annualVariableMen,
			hourlyBaseWomen: row.hourlyBaseWomen,
			hourlyBaseMen: row.hourlyBaseMen,
			hourlyVariableWomen: row.hourlyVariableWomen,
			hourlyVariableMen: row.hourlyVariableMen,
		});
		map.set(row.declarationId, existing);
	}
	return map;
}

// ── CSE opinions ─────────────────────────────────────────────────────

type CseRow = {
	type: string;
	opinion: string | null;
	opinionDate: string | null;
};

async function getCseOpinionsByDeclaration(
	keys: Array<{ siren: string; year: number }>,
): Promise<Map<string, CseRow[]>> {
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

	const map = new Map<string, CseRow[]>();
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
