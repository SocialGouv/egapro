import { notFound } from "next/navigation";
import type { StepCategoryData } from "~/modules/declaration-remuneration";
import {
	SECOND_DECLARATION_TOTAL_STEPS,
	SecondDeclarationStep1Info,
	SecondDeclarationStep2Form,
	SecondDeclarationStep3Review,
} from "~/modules/declaration-remuneration";
import { api, HydrateClient } from "~/trpc/server";

type Props = {
	params: Promise<{ step: string }>;
};

type DbCategory = {
	step: number;
	categoryName: string;
	womenCount: number | null;
	menCount: number | null;
	womenValue: string | null;
	menValue: string | null;
	womenMedianValue: string | null;
	menMedianValue: string | null;
};

function mapCategories(
	categories: DbCategory[],
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

export default async function SecondDeclarationStepPage({ params }: Props) {
	const { step: stepParam } = await params;
	const step = Number.parseInt(stepParam, 10);

	if (Number.isNaN(step) || step < 1 || step > SECOND_DECLARATION_TOTAL_STEPS) {
		notFound();
	}

	const data = await api.declaration.getOrCreate();
	const currentYear = new Date().getFullYear();

	const step5Categories = mapCategories(data.categories, 5);
	const step7Categories = mapCategories(data.categories, 7);

	const declarationDate = data.declaration.updatedAt
		? new Date(data.declaration.updatedAt).toLocaleDateString("fr-FR")
		: new Date().toLocaleDateString("fr-FR");

	if (step === 1) {
		return (
			<SecondDeclarationStep1Info
				currentYear={currentYear}
				declarationDate={declarationDate}
			/>
		);
	}

	if (step === 2) {
		return (
			<HydrateClient>
				<SecondDeclarationStep2Form
					initialFirstDeclarationCategories={step5Categories}
					initialSecondDeclarationCategories={
						step7Categories.length > 0 ? step7Categories : undefined
					}
				/>
			</HydrateClient>
		);
	}

	// step === 3
	const reviewCategories =
		step7Categories.length > 0 ? step7Categories : step5Categories;

	return (
		<HydrateClient>
			<SecondDeclarationStep3Review
				secondDeclarationCategories={reviewCategories}
			/>
		</HydrateClient>
	);
}
