import { and, desc, eq, getTableColumns, lt } from "drizzle-orm";

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
 *
 * All columns default to `null`; the identifying / non-null-in-schema fields
 * (id, siren, year, declarantId, currentStep, status, timestamps) are
 * overridden explicitly so TypeScript enforces the shape.
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
	const allNull = Object.fromEntries(
		Object.keys(getTableColumns(declarations)).map((key) => [key, null]),
	);
	const now = new Date();
	return {
		...allNull,
		id: "",
		siren,
		year,
		declarantId,
		currentStep: 0,
		status: "draft",
		createdAt: now,
		updatedAt: now,
	} as DeclarationRow;
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
	// Find the most recent submitted declaration (strictly before currentYear)
	// that actually contains indicator 7 — i.e. has at least one row in
	// app_job_category. The inner join filters empty declarations out; ordering
	// by year desc + limit 1 keeps this to a single bounded round-trip, so a
	// company with no indicator 7 on N-1 falls back to N-2 / N-3 automatically.
	const [previousDeclaration] = await tx
		.select({ id: declarations.id })
		.from(declarations)
		.innerJoin(jobCategories, eq(jobCategories.declarationId, declarations.id))
		.where(
			and(
				eq(declarations.siren, siren),
				lt(declarations.year, currentYear),
				eq(declarations.status, "submitted"),
			),
		)
		.orderBy(desc(declarations.year))
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
