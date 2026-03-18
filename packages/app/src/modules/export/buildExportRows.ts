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

	return rows.map((row) => ({
		siren: row.siren,
		companyName: row.companyName,
		year: row.year,
		declarationType: row.declarationType,
		categoryIndex: row.categoryIndex,
		categoryName: row.categoryName,
		categoryDetail: row.categoryDetail,
		categorySource: row.categorySource,
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
	}));
}

// ── Private helpers ──────────────────────────────────────────────────

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

type CategoryRow = {
	step: number;
	categoryName: string;
	womenCount: number | null;
	menCount: number | null;
	womenValue: string | null;
	menValue: string | null;
};

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

function findCategory(
	categories: CategoryRow[],
	step: number,
	name: string,
): CategoryRow | undefined {
	return categories.find((c) => c.step === step && c.categoryName === name);
}

type IndicatorAFields = Pick<
	ExportRow,
	| "indAAnnualMeanWomen"
	| "indAAnnualMeanMen"
	| "indAHourlyMeanWomen"
	| "indAHourlyMeanMen"
	| "indAAnnualMedianWomen"
	| "indAAnnualMedianMen"
	| "indAHourlyMedianWomen"
	| "indAHourlyMedianMen"
>;

function mapIndicatorA(categories: CategoryRow[]): IndicatorAFields {
	const annualMean = findCategory(categories, 2, "Annuelle brute moyenne");
	const hourlyMean = findCategory(categories, 2, "Horaire brute moyenne");
	const annualMedian = findCategory(categories, 2, "Annuelle brute médiane");
	const hourlyMedian = findCategory(categories, 2, "Horaire brute médiane");

	return {
		indAAnnualMeanWomen: annualMean?.womenValue ?? null,
		indAAnnualMeanMen: annualMean?.menValue ?? null,
		indAHourlyMeanWomen: hourlyMean?.womenValue ?? null,
		indAHourlyMeanMen: hourlyMean?.menValue ?? null,
		indAAnnualMedianWomen: annualMedian?.womenValue ?? null,
		indAAnnualMedianMen: annualMedian?.menValue ?? null,
		indAHourlyMedianWomen: hourlyMedian?.womenValue ?? null,
		indAHourlyMedianMen: hourlyMedian?.menValue ?? null,
	};
}

type IndicatorBFields = Pick<
	ExportRow,
	| "indBAnnualMeanWomen"
	| "indBAnnualMeanMen"
	| "indBHourlyMeanWomen"
	| "indBHourlyMeanMen"
	| "indBAnnualMedianWomen"
	| "indBAnnualMedianMen"
	| "indBHourlyMedianWomen"
	| "indBHourlyMedianMen"
	| "indBBeneficiariesWomen"
	| "indBBeneficiariesMen"
>;

function mapIndicatorB(categories: CategoryRow[]): IndicatorBFields {
	const annualMean = findCategory(categories, 3, "Annuelle brute moyenne");
	const hourlyMean = findCategory(categories, 3, "Horaire brute moyenne");
	const annualMedian = findCategory(categories, 3, "Annuelle brute médiane");
	const hourlyMedian = findCategory(categories, 3, "Horaire brute médiane");
	const beneficiaries = findCategory(categories, 3, "Bénéficiaires");

	return {
		indBAnnualMeanWomen: annualMean?.womenValue ?? null,
		indBAnnualMeanMen: annualMean?.menValue ?? null,
		indBHourlyMeanWomen: hourlyMean?.womenValue ?? null,
		indBHourlyMeanMen: hourlyMean?.menValue ?? null,
		indBAnnualMedianWomen: annualMedian?.womenValue ?? null,
		indBAnnualMedianMen: annualMedian?.menValue ?? null,
		indBHourlyMedianWomen: hourlyMedian?.womenValue ?? null,
		indBHourlyMedianMen: hourlyMedian?.menValue ?? null,
		indBBeneficiariesWomen: beneficiaries?.womenValue ?? null,
		indBBeneficiariesMen: beneficiaries?.menValue ?? null,
	};
}

type IndicatorFFields = Pick<
	ExportRow,
	| "indFAnnualQ1Women"
	| "indFAnnualQ1Men"
	| "indFAnnualQ1Threshold"
	| "indFAnnualQ2Women"
	| "indFAnnualQ2Men"
	| "indFAnnualQ2Threshold"
	| "indFAnnualQ3Women"
	| "indFAnnualQ3Men"
	| "indFAnnualQ3Threshold"
	| "indFAnnualQ4Women"
	| "indFAnnualQ4Men"
	| "indFAnnualQ4Threshold"
	| "indFHourlyQ1Women"
	| "indFHourlyQ1Men"
	| "indFHourlyQ1Threshold"
	| "indFHourlyQ2Women"
	| "indFHourlyQ2Men"
	| "indFHourlyQ2Threshold"
	| "indFHourlyQ3Women"
	| "indFHourlyQ3Men"
	| "indFHourlyQ3Threshold"
	| "indFHourlyQ4Women"
	| "indFHourlyQ4Men"
	| "indFHourlyQ4Threshold"
>;

function mapIndicatorF(categories: CategoryRow[]): IndicatorFFields {
	const aq1 = findCategory(categories, 4, "annual:1er quartile");
	const aq2 = findCategory(categories, 4, "annual:2e quartile");
	const aq3 = findCategory(categories, 4, "annual:3e quartile");
	const aq4 = findCategory(categories, 4, "annual:4e quartile");
	const hq1 = findCategory(categories, 4, "hourly:1er quartile");
	const hq2 = findCategory(categories, 4, "hourly:2e quartile");
	const hq3 = findCategory(categories, 4, "hourly:3e quartile");
	const hq4 = findCategory(categories, 4, "hourly:4e quartile");

	return {
		indFAnnualQ1Women: aq1?.womenCount ?? null,
		indFAnnualQ1Men: aq1?.menCount ?? null,
		indFAnnualQ1Threshold: aq1?.womenValue ?? null,
		indFAnnualQ2Women: aq2?.womenCount ?? null,
		indFAnnualQ2Men: aq2?.menCount ?? null,
		indFAnnualQ2Threshold: aq2?.womenValue ?? null,
		indFAnnualQ3Women: aq3?.womenCount ?? null,
		indFAnnualQ3Men: aq3?.menCount ?? null,
		indFAnnualQ3Threshold: aq3?.womenValue ?? null,
		indFAnnualQ4Women: aq4?.womenCount ?? null,
		indFAnnualQ4Men: aq4?.menCount ?? null,
		indFAnnualQ4Threshold: aq4?.womenValue ?? null,
		indFHourlyQ1Women: hq1?.womenCount ?? null,
		indFHourlyQ1Men: hq1?.menCount ?? null,
		indFHourlyQ1Threshold: hq1?.womenValue ?? null,
		indFHourlyQ2Women: hq2?.womenCount ?? null,
		indFHourlyQ2Men: hq2?.menCount ?? null,
		indFHourlyQ2Threshold: hq2?.womenValue ?? null,
		indFHourlyQ3Women: hq3?.womenCount ?? null,
		indFHourlyQ3Men: hq3?.menCount ?? null,
		indFHourlyQ3Threshold: hq3?.womenValue ?? null,
		indFHourlyQ4Women: hq4?.womenCount ?? null,
		indFHourlyQ4Men: hq4?.menCount ?? null,
		indFHourlyQ4Threshold: hq4?.womenValue ?? null,
	};
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
