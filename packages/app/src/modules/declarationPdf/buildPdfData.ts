import "server-only";

import { and, eq } from "drizzle-orm";
import { formatLongDate } from "~/modules/domain";
import { mapToEmployeeCategoryRows } from "~/server/api/routers/declarationHelpers";
import { db } from "~/server/db";
import {
	companies,
	declarations,
	employeeCategories,
	jobCategories,
} from "~/server/db/schema";

import type { DeclarationPdfData, QuartileCategory } from "./types";

const QUARTILE_NAMES = [
	"1er quartile",
	"2e quartile",
	"3e quartile",
	"4e quartile",
] as const;

type Declaration = typeof declarations.$inferSelect;

function buildStep2Rows(d: Declaration) {
	return [
		{
			label: "Annuelle brute moyenne",
			womenValue: d.indicatorAAnnualWomen ?? "",
			menValue: d.indicatorAAnnualMen ?? "",
		},
		{
			label: "Horaire brute moyenne",
			womenValue: d.indicatorAHourlyWomen ?? "",
			menValue: d.indicatorAHourlyMen ?? "",
		},
		{
			label: "Annuelle brute médiane",
			womenValue: d.indicatorCAnnualWomen ?? "",
			menValue: d.indicatorCAnnualMen ?? "",
		},
		{
			label: "Horaire brute médiane",
			womenValue: d.indicatorCHourlyWomen ?? "",
			menValue: d.indicatorCHourlyMen ?? "",
		},
	];
}

function buildStep3Data(d: Declaration) {
	const rows = [
		{
			label: "Annuelle brute moyenne",
			womenValue: d.indicatorBAnnualWomen ?? "",
			menValue: d.indicatorBAnnualMen ?? "",
		},
		{
			label: "Horaire brute moyenne",
			womenValue: d.indicatorBHourlyWomen ?? "",
			menValue: d.indicatorBHourlyMen ?? "",
		},
		{
			label: "Annuelle brute médiane",
			womenValue: d.indicatorDAnnualWomen ?? "",
			menValue: d.indicatorDAnnualMen ?? "",
		},
		{
			label: "Horaire brute médiane",
			womenValue: d.indicatorDHourlyWomen ?? "",
			menValue: d.indicatorDHourlyMen ?? "",
		},
	];
	return {
		rows,
		beneficiaryWomen: d.indicatorEWomen ?? "",
		beneficiaryMen: d.indicatorEMen ?? "",
	};
}

function buildQuartileCategories(d: Declaration): QuartileCategory[] {
	const annualThresholds = [
		d.indicatorFAnnualThreshold1,
		d.indicatorFAnnualThreshold2,
		d.indicatorFAnnualThreshold3,
		d.indicatorFAnnualThreshold4,
	];
	const annualWomen = [
		d.indicatorFAnnualWomen1,
		d.indicatorFAnnualWomen2,
		d.indicatorFAnnualWomen3,
		d.indicatorFAnnualWomen4,
	];
	const annualMen = [
		d.indicatorFAnnualMen1,
		d.indicatorFAnnualMen2,
		d.indicatorFAnnualMen3,
		d.indicatorFAnnualMen4,
	];

	const hourlyThresholds = [
		d.indicatorFHourlyThreshold1,
		d.indicatorFHourlyThreshold2,
		d.indicatorFHourlyThreshold3,
		d.indicatorFHourlyThreshold4,
	];
	const hourlyWomen = [
		d.indicatorFHourlyWomen1,
		d.indicatorFHourlyWomen2,
		d.indicatorFHourlyWomen3,
		d.indicatorFHourlyWomen4,
	];
	const hourlyMen = [
		d.indicatorFHourlyMen1,
		d.indicatorFHourlyMen2,
		d.indicatorFHourlyMen3,
		d.indicatorFHourlyMen4,
	];

	const annualCategories: QuartileCategory[] = QUARTILE_NAMES.map(
		(quartileName, i) => ({
			name: `annual:${quartileName}`,
			womenCount: annualWomen[i] ?? undefined,
			menCount: annualMen[i] ?? undefined,
			womenValue: annualThresholds[i] ?? undefined,
		}),
	);

	const hourlyCategories: QuartileCategory[] = QUARTILE_NAMES.map(
		(quartileName, i) => ({
			name: `hourly:${quartileName}`,
			womenCount: hourlyWomen[i] ?? undefined,
			menCount: hourlyMen[i] ?? undefined,
			womenValue: hourlyThresholds[i] ?? undefined,
		}),
	);

	return [...annualCategories, ...hourlyCategories];
}

export async function buildPdfData(
	siren: string,
	year: number,
	now: Date,
	declarationType: "initial" | "correction" = "initial",
): Promise<DeclarationPdfData> {
	const [declaration] = await db
		.select()
		.from(declarations)
		.where(and(eq(declarations.siren, siren), eq(declarations.year, year)))
		.limit(1);

	if (!declaration) {
		throw new Error("Déclaration introuvable");
	}

	if (declaration.status !== "submitted") {
		throw new Error("La déclaration n'est pas encore soumise");
	}

	const [company] = await db
		.select()
		.from(companies)
		.where(eq(companies.siren, siren))
		.limit(1);

	const jobs = await db
		.select()
		.from(jobCategories)
		.where(eq(jobCategories.declarationId, declaration.id));

	const jobIds = jobs.map((j) => j.id);
	let empCats: (typeof employeeCategories.$inferSelect)[] = [];
	if (jobIds.length > 0) {
		const results = await Promise.all(
			jobIds.map((id) =>
				db
					.select()
					.from(employeeCategories)
					.where(eq(employeeCategories.jobCategoryId, id)),
			),
		);
		empCats = results.flat();
	}

	const step5Categories = mapToEmployeeCategoryRows(
		jobs,
		empCats,
		declarationType,
	);

	return {
		companyName: company?.name ?? `Entreprise ${siren}`,
		siren,
		year,
		generatedAt: formatLongDate(now),
		isSecondDeclaration: declarationType === "correction",
		totalWomen: declaration.totalWomen ?? 0,
		totalMen: declaration.totalMen ?? 0,
		step1Categories: [],
		step2Rows: buildStep2Rows(declaration),
		step3Data: buildStep3Data(declaration),
		step4Categories: buildQuartileCategories(declaration),
		step5Categories,
	};
}
