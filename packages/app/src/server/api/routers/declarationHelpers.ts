import { eq } from "drizzle-orm";

import { employeeCategories, jobCategories } from "~/server/db/schema";

export type Tx = Parameters<
	Parameters<import("~/server/db").DB["transaction"]>[0]
>[0];

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
