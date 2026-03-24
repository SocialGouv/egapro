"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { EmployeeCategoryRow } from "~/modules/declaration-remuneration/types";
import { api } from "~/trpc/react";
import { CategoryForm } from "../step5/CategoryForm";
import { BASE_PATH } from "./constants";
import { ReferencePeriodPicker } from "./ReferencePeriodPicker";
import { SecondDeclarationStepIndicator } from "./SecondDeclarationStepIndicator";

type Props = {
	initialFirstDeclarationCategories: EmployeeCategoryRow[];
	initialSecondDeclarationCategories?: EmployeeCategoryRow[];
	initialSource?: string;
	initialStartDate?: string;
	initialEndDate?: string;
};

export function SecondDeclarationStep2Form({
	initialFirstDeclarationCategories,
	initialSecondDeclarationCategories,
	initialSource,
	initialStartDate = "",
	initialEndDate = "",
}: Props) {
	const router = useRouter();
	const [startDate, setStartDate] = useState(initialStartDate);
	const [endDate, setEndDate] = useState(initialEndDate);
	const [periodError, setPeriodError] = useState("");

	const sourceData =
		initialSecondDeclarationCategories &&
		initialSecondDeclarationCategories.length > 0
			? initialSecondDeclarationCategories
			: initialFirstDeclarationCategories;

	const mutation = api.declaration.updateEmployeeCategories.useMutation({
		onSuccess: () => router.push(`${BASE_PATH}/etape/3`),
	});

	return (
		<CategoryForm
			accordionId="accordion-second-decl"
			descriptionText="Cette seconde déclaration reprend les catégories de salariés définies lors de la première déclaration. Elle permet de mesurer les écarts de rémunération entre les femmes et les hommes au sein de chaque catégorie, en distinguant le salaire de base des composantes variables ou complémentaires."
			initialCategories={sourceData}
			initialSource={initialSource}
			instructionText="Modifiez les données de votre première déclaration avant de valider votre indicateur."
			isSubmitting={mutation.isPending}
			onSubmit={(data) => {
				if (!startDate || !endDate) {
					setPeriodError(
						"La période de référence est obligatoire. Veuillez renseigner les dates de début et de fin.",
					);
					return;
				}
				setPeriodError("");
				mutation.mutate({
					declarationType: "correction",
					source: data.source,
					categories: data.categories,
					referencePeriodStart: startDate,
					referencePeriodEnd: endDate,
				});
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
			submitError={periodError || mutation.error?.message}
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
