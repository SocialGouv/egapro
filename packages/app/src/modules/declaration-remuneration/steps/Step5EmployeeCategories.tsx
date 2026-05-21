"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { useIsImpersonating } from "~/modules/auth";
import { padDecimalToTwo } from "~/modules/domain";
import { api } from "~/trpc/react";
import { DraftLoadingState } from "../shared/draft/DraftLoadingState";
import { useDeclarationDraft } from "../shared/draft/useDeclarationDraft";
import { StepIndicator } from "../shared/StepIndicator";
import type { EmployeeCategoryRow } from "../types";
import { CategoryForm } from "./step5/CategoryForm";

type Step5FormValues = {
	source: string;
	categories: {
		name: string;
		womenCount: string;
		menCount: string;
		annualBaseWomen: string;
		annualBaseMen: string;
		annualVariableWomen: string;
		annualVariableMen: string;
		hourlyBaseWomen: string;
		hourlyBaseMen: string;
		hourlyVariableWomen: string;
		hourlyVariableMen: string;
	}[];
};

type Props = {
	declarationSiren: string;
	declarationYear: number;
	initialCategories?: EmployeeCategoryRow[];
	initialSource?: string;
	maxWomen?: number;
	maxMen?: number;
};

export function Step5EmployeeCategories({
	declarationSiren,
	declarationYear,
	initialCategories,
	initialSource,
	maxWomen,
	maxMen,
}: Props) {
	const router = useRouter();
	const isImpersonating = useIsImpersonating();
	const hasInitialData = (initialCategories?.length ?? 0) > 0;

	const dbValues = useMemo<Step5FormValues>(
		() => ({
			source: initialSource ?? "",
			categories: (initialCategories ?? []).map((row) => ({
				name: row.name,
				womenCount: row.womenCount?.toString() ?? "",
				menCount: row.menCount?.toString() ?? "",
				annualBaseWomen: padDecimalToTwo(row.annualBaseWomen ?? ""),
				annualBaseMen: padDecimalToTwo(row.annualBaseMen ?? ""),
				annualVariableWomen: padDecimalToTwo(row.annualVariableWomen ?? ""),
				annualVariableMen: padDecimalToTwo(row.annualVariableMen ?? ""),
				hourlyBaseWomen: padDecimalToTwo(row.hourlyBaseWomen ?? ""),
				hourlyBaseMen: padDecimalToTwo(row.hourlyBaseMen ?? ""),
				hourlyVariableWomen: padDecimalToTwo(row.hourlyVariableWomen ?? ""),
				hourlyVariableMen: padDecimalToTwo(row.hourlyVariableMen ?? ""),
			})),
		}),
		[initialCategories, initialSource],
	);

	const {
		draft,
		setField,
		clearDraft,
		hasDraft,
		isLoadingDraft,
		isSaving,
		isPendingSave,
	} = useDeclarationDraft<Step5FormValues>({
		siren: declarationSiren,
		year: declarationYear,
		step: 5,
		kind: "main",
		dbValues,
	});

	const mutation = api.declaration.updateEmployeeCategories.useMutation({
		onSuccess: () => {
			clearDraft();
			router.push("/declaration-remuneration/etape/6");
		},
	});

	if (isLoadingDraft) {
		return <DraftLoadingState />;
	}

	const categoryFormDefaultOverride = hasDraft
		? {
				source: draft.source ?? initialSource ?? "",
				categories: draft.categories ?? dbValues.categories,
			}
		: undefined;

	return (
		<CategoryForm
			accordionId="accordion-step5"
			defaultValuesOverride={categoryFormDefaultOverride}
			disabled={isImpersonating}
			initialCategories={initialCategories ?? []}
			initialSource={initialSource}
			instructionText="Saisissez les données manquantes avant de valider votre indicateur."
			isPendingSaveOverride={isPendingSave}
			isSavingOverride={isSaving}
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
			onValuesChange={(values) => setField(values)}
			previousHref="/declaration-remuneration/etape/4"
			referenceYear={declarationYear - 1}
			savedOverride={
				(hasInitialData || hasDraft) && !isPendingSave && !isSaving
			}
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
