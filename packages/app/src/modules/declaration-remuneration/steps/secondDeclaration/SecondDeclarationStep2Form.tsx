"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useIsImpersonating } from "~/modules/auth";
import { DraftLoadingState } from "~/modules/declaration-remuneration/shared/draft/DraftLoadingState";
import { useDeclarationDraft } from "~/modules/declaration-remuneration/shared/draft/useDeclarationDraft";
import { useDraftHydration } from "~/modules/declaration-remuneration/shared/draft/useDraftHydration";
import { useLockContext } from "~/modules/declaration-remuneration/shared/lock/LockContext";
import type { EmployeeCategoryRow } from "~/modules/declaration-remuneration/types";
import {
	type DeclarationFsmStatus,
	getReferenceYearFor,
	isSecondDeclarationWritable,
} from "~/modules/domain";
import { api } from "~/trpc/react";
import { CategoryForm } from "../step5/CategoryForm";
import { BASE_PATH } from "./constants";
import { ReferencePeriodPicker } from "./ReferencePeriodPicker";
import { SecondDeclarationStepIndicator } from "./SecondDeclarationStepIndicator";

type Props = {
	declarationSiren: string;
	declarationYear: number;
	initialFirstDeclarationCategories: EmployeeCategoryRow[];
	initialSecondDeclarationCategories?: EmployeeCategoryRow[];
	initialSource?: string;
	initialStartDate?: string;
	initialEndDate?: string;
	status: DeclarationFsmStatus | null;
};

export function SecondDeclarationStep2Form({
	declarationSiren,
	declarationYear,
	initialFirstDeclarationCategories,
	initialSecondDeclarationCategories,
	initialSource,
	initialStartDate = "",
	initialEndDate = "",
	status,
}: Props) {
	const router = useRouter();
	const isImpersonating = useIsImpersonating();
	const { isReadOnly: isLocked } = useLockContext();
	const isWritable = isSecondDeclarationWritable(status);
	const isFormDisabled = isImpersonating || !isWritable;
	const [startDate, setStartDate] = useState(initialStartDate);
	const [endDate, setEndDate] = useState(initialEndDate);
	const [periodError, setPeriodError] = useState("");

	const sourceData =
		initialSecondDeclarationCategories &&
		initialSecondDeclarationCategories.length > 0
			? initialSecondDeclarationCategories
			: initialFirstDeclarationCategories;
	const hasSavedSecondDeclaration =
		(initialSecondDeclarationCategories?.length ?? 0) > 0;

	const dbValues = useMemo(
		() => ({
			startDate: initialStartDate ?? "",
			endDate: initialEndDate ?? "",
		}),
		[initialStartDate, initialEndDate],
	);

	const { draft, setField, clearDraft, isLoadingDraft } = useDeclarationDraft({
		siren: declarationSiren,
		year: declarationYear,
		step: "second-2",
		kind: "second",
		dbValues,
	});

	const draftHydrated = useDraftHydration(isLoadingDraft, draft, (d) => {
		if (typeof d.startDate === "string") setStartDate(d.startDate);
		if (typeof d.endDate === "string") setEndDate(d.endDate);
	});

	useEffect(() => {
		if (!draftHydrated || isFormDisabled || isLocked) return;
		setField({ startDate, endDate });
	}, [draftHydrated, endDate, isFormDisabled, isLocked, setField, startDate]);

	const mutation = api.declaration.updateEmployeeCategories.useMutation({
		onSuccess: () => {
			clearDraft();
			router.push(`${BASE_PATH}/etape/3`);
		},
	});

	if (!draftHydrated) return <DraftLoadingState />;

	const recapHref = `${BASE_PATH}/etape/3`;
	const nextHref = isWritable ? undefined : recapHref;
	const mimoquageNextHref = hasSavedSecondDeclaration ? recapHref : undefined;

	return (
		<CategoryForm
			accordionId="accordion-second-decl"
			descriptionText="Cette seconde déclaration reprend les catégories de salariés définies lors de la première déclaration. Elle permet de mesurer les écarts de rémunération entre les femmes et les hommes au sein de chaque catégorie, en distinguant le salaire de base des composantes variables ou complémentaires."
			disabled={isFormDisabled}
			initialCategories={sourceData}
			initialSource={initialSource}
			instructionText="Modifiez les données de votre première déclaration avant de valider votre indicateur."
			isSubmitting={mutation.isPending}
			mimoquageNextHref={mimoquageNextHref}
			nextHref={nextHref}
			onSubmit={(data) => {
				if (!isWritable) return;
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
			readOnlyLabel
			referencePeriodPicker={
				<ReferencePeriodPicker
					disabled={isFormDisabled}
					endDate={endDate}
					onEndDateChange={setEndDate}
					onStartDateChange={setStartDate}
					readOnly={isLocked}
					startDate={startDate}
				/>
			}
			referenceYear={getReferenceYearFor(declarationYear)}
			stepper={<SecondDeclarationStepIndicator currentStep={2} />}
			submitError={periodError || mutation.error?.message}
			title={
				<h1 className="fr-h4 fr-mb-0">
					Parcours de mise en conformité pour l&apos;indicateur par catégorie de
					salariés
				</h1>
			}
			tooltipPrefix="tooltip-second-decl"
			readOnly={isLocked}
		/>
	);
}
