import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";

import { formatCategorySource } from "~/modules/declaration-remuneration";
import {
	formatShortDate,
	formatWorkforceForUser,
	getReferencePeriod,
	getReferenceYearFor,
	isDraft,
	parseGipWorkforce,
} from "~/modules/domain";
import {
	activeDeclarationFilter,
	mapToEmployeeCategoryRows,
} from "~/server/api/routers/declarationHelpers";
import { mapToStepData } from "~/server/api/routers/declarationStepMapping";
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

	const [[company], [gip], jobs, transmittedDate, declarantRows] =
		await Promise.all([
			db.select().from(companies).where(eq(companies.siren, siren)).limit(1),
			db
				.select({ workforceEma: gipMdsData.workforceEma })
				.from(gipMdsData)
				.where(and(eq(gipMdsData.siren, siren), eq(gipMdsData.year, year)))
				.limit(1),
			db
				.select()
				.from(jobCategories)
				.where(eq(jobCategories.declarationId, declaration.id)),
			resolveTransmittedDate(
				declaration.id,
				declaration.updatedAt ?? now,
				declarationType,
			),
			declaration.declarantId
				? db
						.select({
							firstName: users.firstName,
							lastName: users.lastName,
							email: users.email,
							phone: users.phone,
						})
						.from(users)
						.where(eq(users.id, declaration.declarantId))
						.limit(1)
				: Promise.resolve([]),
		]);

	const declarant = declarantRows[0];

	const jobIds = jobs.map((j) => j.id);
	const empCats =
		jobIds.length > 0
			? await db
					.select()
					.from(employeeCategories)
					.where(inArray(employeeCategories.jobCategoryId, jobIds))
			: [];

	const categories =
		jobs.length > 0
			? mapToEmployeeCategoryRows(jobs, empCats, declarationType)
			: [];

	const { step2Data, step3Data, step4Data, step2Gaps, step3Gaps } =
		mapToStepData(declaration);

	const gipWorkforce = parseGipWorkforce(gip?.workforceEma);

	const rawSource = jobs.sort((a, b) => a.categoryIndex - b.categoryIndex)[0]
		?.source;
	const source = rawSource ? formatCategorySource(rawSource) : null;

	return {
		year,
		workforceYear: getReferenceYearFor(year),
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
			workforceDisplay: formatWorkforceForUser(gipWorkforce),
		},
		totalWomen: declaration.totalWomen ?? 0,
		totalMen: declaration.totalMen ?? 0,
		hourlyWomen: declaration.hourlyWomen ?? 0,
		hourlyMen: declaration.hourlyMen ?? 0,
		step2Data,
		step3Data,
		step4Data,
		step2Gaps,
		step3Gaps,
		categories,
		source,
	};
}
