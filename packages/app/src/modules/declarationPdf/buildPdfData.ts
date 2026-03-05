import "server-only";

import { and, eq } from "drizzle-orm";
import type { StepCategoryData } from "~/modules/declaration-remuneration";
import { db } from "~/server/db";
import {
	companies,
	declarationCategories,
	declarations,
} from "~/server/db/schema";

import type { DeclarationPdfData } from "./types";

type CategoryRow = typeof declarationCategories.$inferSelect;

function mapStepCategories(
	categories: CategoryRow[],
	step: number,
): StepCategoryData[] {
	return categories
		.filter((c) => c.step === step)
		.map((c) => ({
			name: c.categoryName,
			womenCount: c.womenCount ?? undefined,
			menCount: c.menCount ?? undefined,
			womenValue: c.womenValue ?? undefined,
			menValue: c.menValue ?? undefined,
			womenMedianValue: c.womenMedianValue ?? undefined,
			menMedianValue: c.menMedianValue ?? undefined,
		}));
}

export async function buildPdfData(
	siren: string,
	year: number,
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

	const categories = await db
		.select()
		.from(declarationCategories)
		.where(
			and(
				eq(declarationCategories.siren, siren),
				eq(declarationCategories.year, year),
			),
		);

	const step1Categories = categories
		.filter((c) => c.step === 1)
		.map((c) => ({
			name: c.categoryName,
			women: c.womenCount ?? 0,
			men: c.menCount ?? 0,
		}));

	const step2Rows = categories
		.filter((c) => c.step === 2)
		.map((c) => ({
			label: c.categoryName,
			womenValue: c.womenValue ?? "",
			menValue: c.menValue ?? "",
		}));

	const beneficiaryRow = categories.find(
		(c) => c.step === 3 && c.categoryName === "Bénéficiaires",
	);
	const step3Data = {
		rows: categories
			.filter((c) => c.step === 3 && c.categoryName !== "Bénéficiaires")
			.map((c) => ({
				label: c.categoryName,
				womenValue: c.womenValue ?? "",
				menValue: c.menValue ?? "",
			})),
		beneficiaryWomen: beneficiaryRow?.womenValue ?? "",
		beneficiaryMen: beneficiaryRow?.menValue ?? "",
	};

	const step4Categories = mapStepCategories(categories, 4);
	const step5Categories = mapStepCategories(categories, 5);

	return {
		companyName: company?.name ?? `Entreprise ${siren}`,
		siren,
		year,
		totalWomen: declaration.totalWomen ?? 0,
		totalMen: declaration.totalMen ?? 0,
		step1Categories,
		step2Rows,
		step3Data,
		step4Categories,
		step5Categories,
	};
}
