"use client";

import { useRouter } from "next/navigation";

import { useIsImpersonating } from "~/modules/auth";
import { api } from "~/trpc/react";
import { StepIndicator } from "../shared/StepIndicator";
import type { EmployeeCategoryRow } from "../types";
import { CategoryForm } from "./step5/CategoryForm";

type Props = {
	declarationYear: number;
	initialCategories?: EmployeeCategoryRow[];
	initialSource?: string;
	maxWomen?: number;
	maxMen?: number;
};

export function Step5EmployeeCategories({
	declarationYear,
	initialCategories,
	initialSource,
	maxWomen,
	maxMen,
}: Props) {
	const router = useRouter();
	const isImpersonating = useIsImpersonating();
	const hasInitialData = (initialCategories?.length ?? 0) > 0;

	const mutation = api.declaration.updateEmployeeCategories.useMutation({
		onSuccess: () => router.push("/declaration-remuneration/etape/6"),
	});

	return (
		<CategoryForm
			accordionId="accordion-step5"
			disabled={isImpersonating}
			initialCategories={initialCategories ?? []}
			initialSource={initialSource}
			instructionText="Saisissez les données manquantes avant de valider votre indicateur."
			isSubmitting={mutation.isPending}
			maxMen={maxMen}
			maxWomen={maxWomen}
			mimoquageNextHref={
				hasInitialData ? "/declaration-remuneration/etape/6" : undefined
			}
			onSubmit={(data) =>
				mutation.mutate({
					declarationType: "initial",
					source: data.source,
					categories: data.categories,
				})
			}
			previousHref="/declaration-remuneration/etape/4"
			referenceYear={declarationYear - 1}
			stepper={<StepIndicator currentStep={5} />}
			submitError={mutation.error?.message}
			title={
				<h1 className="fr-h4 fr-mb-0">
					Déclaration des indicateurs de rémunération {declarationYear}
				</h1>
			}
			tooltipPrefix="tooltip-step5"
		/>
	);
}
