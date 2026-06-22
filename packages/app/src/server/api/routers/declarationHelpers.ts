import { and, desc, eq, getTableColumns, isNull, lt, ne } from "drizzle-orm";

import { computeIndicatorPercentages } from "~/modules/declaration-remuneration/shared/computeIndicatorPercentages";
import type {
	Step2Data,
	Step3Data,
	Step4Data,
} from "~/modules/declaration-remuneration/types";
import {
	declarations,
	employeeCategories,
	jobCategories,
} from "~/server/db/schema";

type DeclarationRow = typeof declarations.$inferSelect;

export function activeDeclarationFilter(siren: string, year: number) {
	return and(
		eq(declarations.siren, siren),
		eq(declarations.year, year),
		isNull(declarations.cancelledAt),
	);
}

type PercentagesTx = {
	select: () => {
		from: (table: typeof declarations) => {
			where: (predicate: ReturnType<typeof and>) => {
				limit: (n: number) => Promise<DeclarationRow[]>;
			};
		};
	};
	update: (table: typeof declarations) => {
		set: (values: Record<string, unknown>) => {
			where: (predicate: ReturnType<typeof and>) => Promise<unknown>;
		};
	};
};

type DraftPurgeTx = PercentagesTx;

export async function applyPercentagesAfterUpdate(
	tx: PercentagesTx,
	siren: string,
	year: number,
): Promise<void> {
	const [fresh] = await tx
		.select()
		.from(declarations)
		.where(activeDeclarationFilter(siren, year))
		.limit(1);
	if (!fresh) return;
	const percentages = computeIndicatorPercentages(fresh);
	const percentagesForDb = Object.fromEntries(
		Object.entries(percentages).map(([k, v]) => [
			k,
			v === null ? null : v.toString(),
		]),
	);
	await tx
		.update(declarations)
		.set(percentagesForDb)
		.where(activeDeclarationFilter(siren, year));
}

/**
 * Map a declaration row to the indicator-form step shapes (steps 2, 3, 4).
 * Same mapping regardless of caller — used by the in-flow declaration pages
 * (`etape/[step]/page.tsx`) and the post-submission recap.
 *
 * The `?? ""` (steps 2/3) and `?? undefined` (step 4) are intentional: DB
 * columns are nullable but the form types are `string` and `number?`
 * respectively. The coalescing is the explicit `null → form-shape`
 * conversion — without it TS rejects the assignment.
 */
export function mapToStepData(d: DeclarationRow): {
	step2Data: Step2Data;
	step3Data: Step3Data;
	step4Data: Step4Data;
} {
	return {
		step2Data: {
			indicatorAAnnualWomen: d.indicatorAAnnualWomen ?? "",
			indicatorAAnnualMen: d.indicatorAAnnualMen ?? "",
			indicatorAHourlyWomen: d.indicatorAHourlyWomen ?? "",
			indicatorAHourlyMen: d.indicatorAHourlyMen ?? "",
			indicatorCAnnualWomen: d.indicatorCAnnualWomen ?? "",
			indicatorCAnnualMen: d.indicatorCAnnualMen ?? "",
			indicatorCHourlyWomen: d.indicatorCHourlyWomen ?? "",
			indicatorCHourlyMen: d.indicatorCHourlyMen ?? "",
		},
		step3Data: {
			indicatorBAnnualWomen: d.indicatorBAnnualWomen ?? "",
			indicatorBAnnualMen: d.indicatorBAnnualMen ?? "",
			indicatorBHourlyWomen: d.indicatorBHourlyWomen ?? "",
			indicatorBHourlyMen: d.indicatorBHourlyMen ?? "",
			indicatorDAnnualWomen: d.indicatorDAnnualWomen ?? "",
			indicatorDAnnualMen: d.indicatorDAnnualMen ?? "",
			indicatorDHourlyWomen: d.indicatorDHourlyWomen ?? "",
			indicatorDHourlyMen: d.indicatorDHourlyMen ?? "",
			indicatorEWomen: d.indicatorEWomen ?? "",
			indicatorEMen: d.indicatorEMen ?? "",
		},
		step4Data: {
			annual: [
				{
					threshold: d.indicatorFAnnualThreshold1 ?? "",
					women: d.indicatorFAnnualWomen1 ?? undefined,
					men: d.indicatorFAnnualMen1 ?? undefined,
				},
				{
					threshold: d.indicatorFAnnualThreshold2 ?? "",
					women: d.indicatorFAnnualWomen2 ?? undefined,
					men: d.indicatorFAnnualMen2 ?? undefined,
				},
				{
					threshold: d.indicatorFAnnualThreshold3 ?? "",
					women: d.indicatorFAnnualWomen3 ?? undefined,
					men: d.indicatorFAnnualMen3 ?? undefined,
				},
				{
					threshold: undefined,
					women: d.indicatorFAnnualWomen4 ?? undefined,
					men: d.indicatorFAnnualMen4 ?? undefined,
				},
			],
			hourly: [
				{
					threshold: d.indicatorFHourlyThreshold1 ?? "",
					women: d.indicatorFHourlyWomen1 ?? undefined,
					men: d.indicatorFHourlyMen1 ?? undefined,
				},
				{
					threshold: d.indicatorFHourlyThreshold2 ?? "",
					women: d.indicatorFHourlyWomen2 ?? undefined,
					men: d.indicatorFHourlyMen2 ?? undefined,
				},
				{
					threshold: d.indicatorFHourlyThreshold3 ?? "",
					women: d.indicatorFHourlyWomen3 ?? undefined,
					men: d.indicatorFHourlyMen3 ?? undefined,
				},
				{
					threshold: undefined,
					women: d.indicatorFHourlyWomen4 ?? undefined,
					men: d.indicatorFHourlyMen4 ?? undefined,
				},
			],
		},
	};
}

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
				ne(declarations.status, "draft"),
			),
		)
		.orderBy(desc(declarations.year))
		.limit(1);

	if (!previousDeclaration) return null;

	const jobs = await tx
		.select({
			name: jobCategories.name,
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
		})),
	};
}

type JobCategoryRow = Pick<
	typeof jobCategories.$inferSelect,
	"id" | "name" | "categoryIndex"
>;
type EmployeeCategoryDbRow = Pick<
	typeof employeeCategories.$inferSelect,
	| "jobCategoryId"
	| "declarationType"
	| "womenCount"
	| "menCount"
	| "annualBaseWomen"
	| "annualBaseMen"
	| "annualVariableWomen"
	| "annualVariableMen"
	| "hourlyBaseWomen"
	| "hourlyBaseMen"
	| "hourlyVariableWomen"
	| "hourlyVariableMen"
>;

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

export async function purgeDraftSlice(
	tx: DraftPurgeTx,
	siren: string,
	year: number,
	kind: string,
): Promise<void> {
	const [row] = await tx
		.select()
		.from(declarations)
		.where(activeDeclarationFilter(siren, year))
		.limit(1);

	if (!row?.draft) return;

	const current = row.draft as Record<string, unknown>;
	const { [kind]: _removed, ...remaining } = current;
	const isEmpty = Object.keys(remaining).length === 0;

	await tx
		.update(declarations)
		.set({
			draft: isEmpty ? null : remaining,
			draftUpdatedAt: isEmpty ? null : new Date(),
		})
		.where(activeDeclarationFilter(siren, year));
}
