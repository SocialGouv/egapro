"use client";

import { useRouter } from "next/navigation";

import { getCurrentYear } from "~/modules/domain";
import { api } from "~/trpc/react";
import { StepIndicator } from "../shared/StepIndicator";
import type { EmployeeCategoryRow } from "../types";
import { CategoryForm } from "./step5/CategoryForm";

type Props = {
	initialCategories?: EmployeeCategoryRow[];
	initialSource?: string;
	maxWomen?: number;
	maxMen?: number;
};

export function Step5EmployeeCategories({
	initialCategories,
	initialSource,
	maxWomen,
	maxMen,
}: Props) {
	const currentYear = getCurrentYear();
	const router = useRouter();

	const mutation = api.declaration.updateEmployeeCategories.useMutation({
		onSuccess: () => router.push("/declaration-remuneration/etape/6"),
	});

	return (
		<CategoryForm
			accordionId="accordion-step5"
			initialCategories={initialCategories ?? []}
			initialSource={initialSource}
			instructionText="Saisissez les données manquantes avant de valider votre indicateur."
			isSubmitting={mutation.isPending}
			maxMen={maxMen}
			maxWomen={maxWomen}
			onSubmit={(data) =>
				mutation.mutate({
					declarationType: "initial",
					source: data.source,
					categories: data.categories,
				})
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
