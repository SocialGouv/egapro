import "server-only";

import { and, desc, eq } from "drizzle-orm";

import { SOURCE_LABELS } from "~/modules/declaration-remuneration";
import {
	formatCount,
	formatShortDate,
	GIP_WORKFORCE_ABSENT_DISPLAY,
	getReferencePeriod,
	getWorkforceYearFor,
	isDraft,
	parseGipWorkforce,
	toDisplayWorkforce,
} from "~/modules/domain";
import {
	activeDeclarationFilter,
	mapToEmployeeCategoryRows,
	mapToStepData,
} from "~/server/api/routers/declarationHelpers";
import { db } from "~/server/db";
import {
	companies,
	declarationStatusHistory,
	declarations,
	employeeCategories,
	gipMdsData,
	jobCategories,
	users,
} from "~/server/db/schema";

import type { DeclarationPdfData } from "./types";

async function getLatestEventDate(
	declarationId: string,
	eventType: "submit" | "second_declaration_submit",
): Promise<Date | null> {
	const [row] = await db
		.select({ createdAt: declarationStatusHistory.createdAt })
		.from(declarationStatusHistory)
		.where(
			and(
				eq(declarationStatusHistory.declarationId, declarationId),
				eq(declarationStatusHistory.eventType, eventType),
			),
		)
		.orderBy(desc(declarationStatusHistory.createdAt))
		.limit(1);
	return row?.createdAt ?? null;
}

async function resolveTransmittedDate(
	declarationId: string,
	updatedAt: Date,
	declarationType: "initial" | "correction",
): Promise<Date> {
	if (declarationType === "correction") {
		const second = await getLatestEventDate(
			declarationId,
			"second_declaration_submit",
		);
		if (second) return second;
	}
	const submit = await getLatestEventDate(declarationId, "submit");
	return submit ?? updatedAt;
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
		.where(activeDeclarationFilter(siren, year))
		.limit(1);

	if (!declaration) {
		throw new Error("Déclaration introuvable");
	}

	if (isDraft(declaration.status)) {
		throw new Error("La déclaration n'est pas encore soumise");
	}

	const [company] = await db
		.select()
		.from(companies)
		.where(eq(companies.siren, siren))
		.limit(1);

	const declarant = declaration.declarantId
		? (
				await db
					.select({
						firstName: users.firstName,
						lastName: users.lastName,
						email: users.email,
						phone: users.phone,
					})
					.from(users)
					.where(eq(users.id, declaration.declarantId))
					.limit(1)
			)[0]
		: undefined;

	const [gip] = await db
		.select({ workforceEma: gipMdsData.workforceEma })
		.from(gipMdsData)
		.where(and(eq(gipMdsData.siren, siren), eq(gipMdsData.year, year)))
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

	const categories =
		jobs.length > 0
			? mapToEmployeeCategoryRows(jobs, empCats, declarationType)
			: [];

	const { step2Data, step3Data, step4Data } = mapToStepData(declaration);

	const transmittedDate = await resolveTransmittedDate(
		declaration.id,
		declaration.updatedAt ?? now,
		declarationType,
	);

	const displayWorkforce = toDisplayWorkforce(
		parseGipWorkforce(gip?.workforceEma),
	);

	const rawSource = jobs.sort((a, b) => a.categoryIndex - b.categoryIndex)[0]
		?.source;
	const source = rawSource ? (SOURCE_LABELS[rawSource] ?? rawSource) : null;

	return {
		year,
		workforceYear: getWorkforceYearFor(year),
		isSecondDeclaration: declarationType === "correction",
		transmittedAt: formatShortDate(transmittedDate),
		referencePeriod: getReferencePeriod(year),
		declarant: {
			name: [declarant?.firstName, declarant?.lastName]
				.filter(Boolean)
				.join(" "),
			email: declarant?.email ?? "",
			phone: declarant?.phone ?? "",
		},
		company: {
			name: company?.name ?? `Entreprise ${siren}`,
			siren,
			address: company?.address ?? "",
			nafCode: company?.nafCode ?? null,
			nafLabel: company?.nafLabel ?? null,
			workforceDisplay:
				displayWorkforce !== null
					? formatCount(displayWorkforce)
					: GIP_WORKFORCE_ABSENT_DISPLAY,
		},
		totalWomen: declaration.totalWomen ?? 0,
		totalMen: declaration.totalMen ?? 0,
		step2Data,
		step3Data,
		step4Data,
		categories,
		source,
	};
}
