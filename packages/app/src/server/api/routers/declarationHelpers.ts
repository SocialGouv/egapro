import { and, eq } from "drizzle-orm";

import {
	declarations,
	employeeCategories,
	jobCategories,
} from "~/server/db/schema";

type DeclarationRow = typeof declarations.$inferSelect;

/**
 * Build a transient, zero-value declaration row used to satisfy the read-only
 * UI when an admin impersonates a company that has not started a declaration
 * yet (issue #3230). The row is never persisted — it only exists in memory
 * to let layouts and step pages render their empty state without
 * short-circuiting on a missing record.
 */
export function buildPlaceholderDeclaration({
	siren,
	year,
	declarantId,
}: {
	siren: string;
	year: number;
	declarantId: string;
}): DeclarationRow {
	const now = new Date();
	return {
		id: "",
		siren,
		year,
		declarantId,
		totalWomen: null,
		totalMen: null,
		remunerationScore: null,
		variableRemunerationScore: null,
		quartileScore: null,
		categoryScore: null,
		compliancePath: null,
		indicatorAAnnualWomen: null,
		indicatorAAnnualMen: null,
		indicatorAHourlyWomen: null,
		indicatorAHourlyMen: null,
		indicatorBAnnualWomen: null,
		indicatorBAnnualMen: null,
		indicatorBHourlyWomen: null,
		indicatorBHourlyMen: null,
		indicatorCAnnualWomen: null,
		indicatorCAnnualMen: null,
		indicatorCHourlyWomen: null,
		indicatorCHourlyMen: null,
		indicatorDAnnualWomen: null,
		indicatorDAnnualMen: null,
		indicatorDHourlyWomen: null,
		indicatorDHourlyMen: null,
		indicatorEWomen: null,
		indicatorEMen: null,
		indicatorFAnnualThreshold1: null,
		indicatorFAnnualThreshold2: null,
		indicatorFAnnualThreshold3: null,
		indicatorFAnnualThreshold4: null,
		indicatorFAnnualWomen1: null,
		indicatorFAnnualWomen2: null,
		indicatorFAnnualWomen3: null,
		indicatorFAnnualWomen4: null,
		indicatorFAnnualMen1: null,
		indicatorFAnnualMen2: null,
		indicatorFAnnualMen3: null,
		indicatorFAnnualMen4: null,
		indicatorFHourlyThreshold1: null,
		indicatorFHourlyThreshold2: null,
		indicatorFHourlyThreshold3: null,
		indicatorFHourlyThreshold4: null,
		indicatorFHourlyWomen1: null,
		indicatorFHourlyWomen2: null,
		indicatorFHourlyWomen3: null,
		indicatorFHourlyWomen4: null,
		indicatorFHourlyMen1: null,
		indicatorFHourlyMen2: null,
		indicatorFHourlyMen3: null,
		indicatorFHourlyMen4: null,
		currentStep: 0,
		status: "draft",
		secondDeclarationStep: null,
		secondDeclarationStatus: null,
		secondDeclReferencePeriodStart: null,
		secondDeclReferencePeriodEnd: null,
		complianceCompletedAt: null,
		createdAt: now,
		updatedAt: now,
	};
}

export type Tx = Parameters<
	Parameters<import("~/server/db").DB["transaction"]>[0]
>[0];

type DbOrTx = Tx | import("~/server/db").DB;

type EmployeeCategoryData = {
	womenCount?: number;
	menCount?: number;
	annualBaseWomen?: string;
	annualBaseMen?: string;
	annualVariableWomen?: string;
	annualVariableMen?: string;
	hourlyBaseWomen?: string;
	hourlyBaseMen?: string;
	hourlyVariableWomen?: string;
	hourlyVariableMen?: string;
};

export function buildEmployeeCategoryValues(
	jobCategoryId: string,
	declarationType: "initial" | "correction",
	data: EmployeeCategoryData,
) {
	return {
		jobCategoryId,
		declarationType: declarationType as typeof declarationType,
		womenCount: data.womenCount ?? null,
		menCount: data.menCount ?? null,
		annualBaseWomen: data.annualBaseWomen ?? null,
		annualBaseMen: data.annualBaseMen ?? null,
		annualVariableWomen: data.annualVariableWomen ?? null,
		annualVariableMen: data.annualVariableMen ?? null,
		hourlyBaseWomen: data.hourlyBaseWomen ?? null,
		hourlyBaseMen: data.hourlyBaseMen ?? null,
		hourlyVariableWomen: data.hourlyVariableWomen ?? null,
		hourlyVariableMen: data.hourlyVariableMen ?? null,
	};
}

export async function deleteJobAndEmployeeCategories(
	tx: Tx,
	declarationId: string,
) {
	const jobs = await tx
		.select({ id: jobCategories.id })
		.from(jobCategories)
		.where(eq(jobCategories.declarationId, declarationId));
	for (const job of jobs) {
		await tx
			.delete(employeeCategories)
			.where(eq(employeeCategories.jobCategoryId, job.id));
	}
	if (jobs.length > 0) {
		await tx
			.delete(jobCategories)
			.where(eq(jobCategories.declarationId, declarationId));
	}
}

export async function fetchAllCategories(tx: Tx, declarationId: string) {
	const jobs = await tx
		.select()
		.from(jobCategories)
		.where(eq(jobCategories.declarationId, declarationId));

	const jobIds = jobs.map((j) => j.id);
	let empCategories: (typeof employeeCategories.$inferSelect)[] = [];
	if (jobIds.length > 0) {
		const results = await Promise.all(
			jobIds.map((id) =>
				tx
					.select()
					.from(employeeCategories)
					.where(eq(employeeCategories.jobCategoryId, id)),
			),
		);
		empCategories = results.flat();
	}

	return {
		jobCategories: jobs,
		employeeCategories: empCategories,
	};
}

export async function fetchPreviousYearJobCategories(
	tx: DbOrTx,
	siren: string,
	currentYear: number,
) {
	const previousYear = currentYear - 1;

	const [previousDeclaration] = await tx
		.select({ id: declarations.id })
		.from(declarations)
		.where(
			and(
				eq(declarations.siren, siren),
				eq(declarations.year, previousYear),
				eq(declarations.status, "submitted"),
			),
		)
		.limit(1);

	if (!previousDeclaration) return null;

	const jobs = await tx
		.select({
			name: jobCategories.name,
			detail: jobCategories.detail,
			source: jobCategories.source,
			categoryIndex: jobCategories.categoryIndex,
		})
		.from(jobCategories)
		.where(eq(jobCategories.declarationId, previousDeclaration.id));

	if (jobs.length === 0) return null;

	const sorted = [...jobs].sort((a, b) => a.categoryIndex - b.categoryIndex);
	const source = sorted[0]?.source ?? "";

	return {
		source,
		categories: sorted.map((j) => ({
			name: j.name,
			detail: j.detail ?? "",
		})),
	};
}

type JobCategoryRow = typeof jobCategories.$inferSelect;
type EmployeeCategoryDbRow = typeof employeeCategories.$inferSelect;

export function mapToEmployeeCategoryRows(
	jobs: JobCategoryRow[],
	empCats: EmployeeCategoryDbRow[],
	declarationType: "initial" | "correction",
) {
	return jobs
		.sort((a, b) => a.categoryIndex - b.categoryIndex)
		.map((job) => {
			const emp = empCats.find(
				(e) =>
					e.jobCategoryId === job.id && e.declarationType === declarationType,
			);
			return {
				name: job.name,
				detail: job.detail ?? "",
				womenCount: emp?.womenCount ?? null,
				menCount: emp?.menCount ?? null,
				annualBaseWomen: emp?.annualBaseWomen ?? null,
				annualBaseMen: emp?.annualBaseMen ?? null,
				annualVariableWomen: emp?.annualVariableWomen ?? null,
				annualVariableMen: emp?.annualVariableMen ?? null,
				hourlyBaseWomen: emp?.hourlyBaseWomen ?? null,
				hourlyBaseMen: emp?.hourlyBaseMen ?? null,
				hourlyVariableWomen: emp?.hourlyVariableWomen ?? null,
				hourlyVariableMen: emp?.hourlyVariableMen ?? null,
			};
		});
}
