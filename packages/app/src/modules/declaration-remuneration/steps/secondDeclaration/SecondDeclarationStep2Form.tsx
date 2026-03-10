"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { StepCategoryData } from "~/modules/declaration-remuneration/types";
import { CategoryForm } from "../step5/CategoryForm";
import { BASE_PATH } from "./constants";
import { ReferencePeriodPicker } from "./ReferencePeriodPicker";
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
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");

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
			descriptionText="Cette seconde déclaration reprend les catégories de salariés définies lors de la première déclaration. Elle permet de mesurer les écarts de rémunération entre les femmes et les hommes au sein de chaque catégorie, en distinguant le salaire de base des composantes variables ou complémentaires."
			initialCategories={sourceData}
			instructionText="Modifiez les données de votre première déclaration avant de valider votre indicateur."
			isSubmitting={isSubmitting}
			onSubmit={() => {
				// TODO: Call tRPC mutation when backend is ready
				router.push(`${BASE_PATH}/etape/3`);
			}}
			previousHref={`${BASE_PATH}/etape/1`}
			readOnlyNameDetail
			referencePeriodPicker={
				<ReferencePeriodPicker
					endDate={endDate}
					onEndDateChange={setEndDate}
					onStartDateChange={setStartDate}
					startDate={startDate}
				/>
			}
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
