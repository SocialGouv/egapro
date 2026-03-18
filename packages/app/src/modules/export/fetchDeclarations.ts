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

// ── Main query ───────────────────────────────────────────────────────

type DeclarationRow = Awaited<
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

export type CategoryRow = {
	step: number;
	categoryName: string;
	womenCount: number | null;
	menCount: number | null;
	womenValue: string | null;
	menValue: string | null;
	womenMedianValue: string | null;
	menMedianValue: string | null;
};

export async function fetchCategoriesByDeclaration(
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
			womenMedianValue: declarationCategories.womenMedianValue,
			menMedianValue: declarationCategories.menMedianValue,
		})
		.from(declarationCategories)
		.where(or(...pairConditions));

	const map = new Map<string, CategoryRow[]>();
	for (const row of rows) {
		const key = `${row.siren}-${row.year}`;
		const existing = map.get(key) ?? [];
		existing.push(row);
		map.set(key, existing);
	}
	return map;
}

// ── Indicator G (jobCategories + employeeCategories) ─────────────────

export type IndicatorGEntry = {
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

	const map = new Map<string, IndicatorGEntry[]>();
	for (const row of rows) {
		const existing = map.get(row.declarationId) ?? [];
		existing.push(row);
		map.set(row.declarationId, existing);
	}
	return map;
}

// ── CSE opinions ─────────────────────────────────────────────────────

export type CseRow = {
	type: string;
	opinion: string | null;
	opinionDate: string | null;
};

export async function fetchCseOpinionsByDeclaration(
	keys: Array<{ siren: string; year: number }>,
): Promise<Map<string, CseRow[]>> {
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

	const map = new Map<string, CseRow[]>();
	for (const row of rows) {
		const key = `${row.siren}-${row.year}`;
		const existing = map.get(key) ?? [];
		existing.push(row);
		map.set(key, existing);
	}
	return map;
}

// ── Build indicators from raw rows ───────────────────────────────────

const MEAN_CATEGORIES = ["Annuelle brute moyenne", "Horaire brute moyenne"];
const MEDIAN_CATEGORIES = ["Annuelle brute médiane", "Horaire brute médiane"];
const BENEFICIARY_CATEGORY = "Bénéficiaires";

export function buildIndicators(categories: CategoryRow[]) {
	const step2 = categories.filter((c) => c.step === 2);
	const step3 = categories.filter((c) => c.step === 3);
	const step4 = categories.filter((c) => c.step === 4);

	const payValue = (c: CategoryRow) => ({
		category: c.categoryName,
		womenValue: c.womenValue,
		menValue: c.menValue,
	});

	return {
		A: step2
			.filter((c) => MEAN_CATEGORIES.includes(c.categoryName))
			.map(payValue),
		B: step3
			.filter(
				(c) =>
					MEAN_CATEGORIES.includes(c.categoryName) &&
					c.categoryName !== BENEFICIARY_CATEGORY,
			)
			.map(payValue),
		C: step2
			.filter((c) => MEDIAN_CATEGORIES.includes(c.categoryName))
			.map(payValue),
		D: step3
			.filter((c) => MEDIAN_CATEGORIES.includes(c.categoryName))
			.map(payValue),
		E: step3
			.filter((c) => c.categoryName === BENEFICIARY_CATEGORY)
			.map(payValue),
		F: step4.map((c) => ({
			category: c.categoryName,
			womenCount: c.womenCount,
			menCount: c.menCount,
			womenValue: c.womenValue,
		})),
	};
}

type IndicatorGCategory = Omit<IndicatorGEntry, "declarationType">;

export function buildIndicatorG(entries: IndicatorGEntry[]): {
	initial: IndicatorGCategory[];
	correction: IndicatorGCategory[];
} {
	const toCategory = ({ declarationType: _, ...rest }: IndicatorGEntry) => rest;

	return {
		initial: entries
			.filter((e) => e.declarationType === "initial")
			.map(toCategory),
		correction: entries
			.filter((e) => e.declarationType === "correction")
			.map(toCategory),
	};
}

// ── Assemble declaration response ────────────────────────────────────

export function assembleDeclaration(
	row: DeclarationRow,
	categories: CategoryRow[],
	indicatorGEntries: IndicatorGEntry[],
	opinions: CseRow[],
) {
	const { initial, correction } = buildIndicatorG(indicatorGEntries);

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
		indicators: {
			...buildIndicators(categories),
			G: initial.length > 0 ? initial : null,
		},
		secondDeclaration: {
			status: row.secondDeclarationStatus,
			referencePeriodStart: row.secondDeclReferencePeriodStart,
			referencePeriodEnd: row.secondDeclReferencePeriodEnd,
			correction: correction.length > 0 ? correction : null,
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
}
