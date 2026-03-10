"use client";

import { useRouter } from "next/navigation";

import { api } from "~/trpc/react";
import { StepIndicator } from "../shared/StepIndicator";
import type { StepCategoryData } from "../types";
import { CategoryForm } from "./step5/CategoryForm";

type Props = {
	initialCategories?: StepCategoryData[];
	maxWomen?: number;
	maxMen?: number;
};

export function Step5EmployeeCategories({
	initialCategories,
	maxWomen,
	maxMen,
}: Props) {
	const currentYear = new Date().getFullYear();
	const router = useRouter();

	const mutation = api.declaration.updateStepCategories.useMutation({
		onSuccess: () => router.push("/declaration-remuneration/etape/6"),
	});

	return (
		<CategoryForm
			accordionId="accordion-step5"
			initialCategories={initialCategories ?? []}
			instructionText="Saisissez les données manquantes avant de valider votre indicateur."
			isSubmitting={mutation.isPending}
			maxMen={maxMen}
			maxWomen={maxWomen}
			onSubmit={(serialized) =>
				mutation.mutate({ step: 5, categories: serialized })
			}
			previousHref="/declaration-remuneration/etape/4"
			stepper={<StepIndicator currentStep={5} />}
			submitError={mutation.error?.message}
			title={
				<h1 className="fr-h4 fr-mb-0">
					Déclaration des indicateurs de rémunération {currentYear}
				</h1>
			}
			tooltipPrefix="tooltip-step5"
		/>
	);
}
