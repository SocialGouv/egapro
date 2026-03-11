import { notFound } from "next/navigation";

import {
	SECOND_DECLARATION_TOTAL_STEPS,
	SecondDeclarationStep1Info,
	SecondDeclarationStep2Form,
	SecondDeclarationStep3Review,
} from "~/modules/declaration-remuneration";
import { mapToEmployeeCategoryRows } from "~/server/api/routers/declarationHelpers";
import { api, HydrateClient } from "~/trpc/server";

type Props = {
	params: Promise<{ step: string }>;
};

export default async function SecondDeclarationStepPage({ params }: Props) {
	const { step: stepParam } = await params;
	const step = Number.parseInt(stepParam, 10);

	if (Number.isNaN(step) || step < 1 || step > SECOND_DECLARATION_TOTAL_STEPS) {
		notFound();
	}

	const data = await api.declaration.getOrCreate();
	const currentYear = new Date().getFullYear();

	const initialCategories = mapToEmployeeCategoryRows(
		data.jobCategories,
		data.employeeCategories,
		"initial",
	);

	const hasCorrectionData = data.employeeCategories.some(
		(e) => e.declarationType === "correction",
	);
	const correctionCategories = hasCorrectionData
		? mapToEmployeeCategoryRows(
				data.jobCategories,
				data.employeeCategories,
				"correction",
			)
		: [];

	const initialSource = data.jobCategories[0]?.source;

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
					initialEndDate={
						data.declaration.secondDeclReferencePeriodEnd ?? undefined
					}
					initialFirstDeclarationCategories={initialCategories}
					initialSecondDeclarationCategories={
						correctionCategories.length > 0 ? correctionCategories : undefined
					}
					initialSource={initialSource}
					initialStartDate={
						data.declaration.secondDeclReferencePeriodStart ?? undefined
					}
				/>
			</HydrateClient>
		);
	}

	// step === 3
	const reviewCategories =
		correctionCategories.length > 0 ? correctionCategories : initialCategories;

	return (
		<HydrateClient>
			<SecondDeclarationStep3Review
				secondDeclarationCategories={reviewCategories}
			/>
		</HydrateClient>
	);
}
