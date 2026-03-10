"use client";

import { useRouter } from "next/navigation";

import type { StepCategoryData } from "~/modules/declaration-remuneration/types";
import { CategoryForm } from "../step5/CategoryForm";
import { BASE_PATH } from "./constants";
import { SecondDeclarationStepIndicator } from "./SecondDeclarationStepIndicator";

type Props = {
	initialFirstDeclarationCategories: StepCategoryData[];
	initialSecondDeclarationCategories?: StepCategoryData[];
};

export function SecondDeclarationStep2Form({
	initialFirstDeclarationCategories,
	initialSecondDeclarationCategories,
}: Props) {
	const router = useRouter();

	// Use second declaration data if already started, otherwise pre-fill from first
	const sourceData =
		initialSecondDeclarationCategories &&
		initialSecondDeclarationCategories.length > 0
			? initialSecondDeclarationCategories
			: initialFirstDeclarationCategories;

	// TODO: Replace with actual tRPC mutation when backend is ready
	const isSubmitting = false;

	return (
		<CategoryForm
			accordionId="accordion-second-decl"
			initialCategories={sourceData}
			instructionText="Modifiez les données de votre première déclaration avant de valider votre indicateur."
			isSubmitting={isSubmitting}
			onSubmit={() => {
				// TODO: Call tRPC mutation when backend is ready
				router.push(`${BASE_PATH}/etape/3`);
			}}
			previousHref={`${BASE_PATH}/etape/1`}
			readOnlyNameDetail
			stepper={<SecondDeclarationStepIndicator currentStep={2} />}
			title={
				<h1 className="fr-h4 fr-mb-0">
					Parcours de mise en conformité pour l&apos;indicateur par catégorie de
					salariés
				</h1>
			}
			tooltipPrefix="tooltip-second-decl"
		/>
	);
}
