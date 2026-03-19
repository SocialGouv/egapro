"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useZodForm } from "~/modules/shared/useZodForm";
import { api } from "~/trpc/react";
import { updateStepCategoriesSchema } from "../schemas";
import { buildGipRows } from "../shared/buildGipRows";
import {
	categoriesToRows,
	rowsToCategories,
} from "../shared/categoryRowMapping";
import common from "../shared/common.module.scss";
import { DefinitionAccordion } from "../shared/DefinitionAccordion";
import { DevFillButton } from "../shared/DevFillButton";
import { DEV_STEP2_ROWS } from "../shared/devFillData";
import { FormActions } from "../shared/FormActions";
import { GapInterpretationCallout } from "../shared/GapInterpretationCallout";
import type { GipPrefillData } from "../shared/gipMdsMapping";
import {
	DEFAULT_PAY_GAP_ROWS,
	handlePayGapRowChange,
	PayGapTable,
} from "../shared/PayGapTable";
import { PrefillSource } from "../shared/PrefillSource";
import { SavedIndicator } from "../shared/SavedIndicator";
import { StepIndicator } from "../shared/StepIndicator";
import { TooltipButton } from "../shared/TooltipButton";
import type { PayGapField, PayGapRow } from "../types";

type Step2PayGapProps = {
	initialRows?: PayGapRow[];
	gipPrefillData?: GipPrefillData;
};

export function Step2PayGap({ initialRows, gipPrefillData }: Step2PayGapProps) {
	const router = useRouter();

	const hasSavedRows = !!initialRows?.length;
	const defaultRows = hasSavedRows
		? initialRows
		: gipPrefillData
			? buildGipRows(gipPrefillData.step2)
			: DEFAULT_PAY_GAP_ROWS;

	const hasInitialData =
		initialRows?.some((r) => r.womenValue || r.menValue) ?? false;

	const form = useZodForm(updateStepCategoriesSchema, {
		defaultValues: {
			step: 2,
			categories: rowsToCategories(defaultRows),
		},
	});

	const categories = form.watch("categories");
	const rows = categoriesToRows(categories);

	const [saved, setSaved] = useState(hasInitialData);
	const [validationError, setValidationError] = useState<string | null>(null);

	const currentYear = new Date().getFullYear();

	const mutation = api.declaration.updateStepCategories.useMutation({
		onSuccess: () => router.push("/declaration-remuneration/etape/3"),
	});

	function handleRowChange(index: number, field: PayGapField, value: string) {
		const updated = handlePayGapRowChange(rows, index, field, value);
		if (!updated) return;
		form.setValue("categories", rowsToCategories(updated));
		setSaved(false);
	}

	const onSubmit = form.handleSubmit(() => {
		const incomplete = rows.some((r) => !r.womenValue || !r.menValue);
		if (incomplete) {
			setValidationError(
				"Veuillez renseigner toutes les données de rémunération avant de passer à l'étape suivante.",
			);
			return;
		}
		setValidationError(null);
		mutation.mutate({
			step: 2,
			categories: rowsToCategories(rows),
		});
	});

	return (
		<form className={common.flexColumnGap2} onSubmit={onSubmit}>
			{/* Title + save status */}
			<div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters">
				<div className="fr-col">
					<h1 className="fr-h4 fr-mb-0">
						Déclaration des indicateurs de rémunération {currentYear}
					</h1>
				</div>
				<div className="fr-col-auto">
					<DevFillButton
						onFill={() => {
							form.setValue("categories", rowsToCategories(DEV_STEP2_ROWS));
							setSaved(false);
						}}
					/>
				</div>
				{saved && (
					<div className="fr-col-auto">
						<SavedIndicator />
					</div>
				)}
			</div>

			<StepIndicator currentStep={2} />

			{/* Introduction */}
			<div className={common.flexColumnGap1}>
				<p className="fr-mb-0">
					Ces indicateurs mesurent la différence de rémunération, moyenne et
					médiane, entre les femmes et les hommes, exprimée en pourcentage du
					salaire masculin correspondant. Ils couvrent l&apos;ensemble de la
					rémunération : la partie fixe ainsi que les composantes variables ou
					complémentaires.
				</p>

				<p className="fr-mb-0">
					<strong>
						{gipPrefillData
							? "Vérifiez les informations préremplies à partir de vos données DSN et modifiez-les si nécessaire avant de valider vos indicateurs (en cas d'erreur, pensez à corriger votre DSN)."
							: "Renseignez les informations avant de valider vos indicateurs."}
					</strong>
					<TooltipButton
						id="tooltip-step2-info"
						label="Information sur les indicateurs"
					/>
				</p>

				<p className="fr-mb-0">Tous les champs sont obligatoires.</p>
			</div>

			{/* Data section */}
			<div className={common.dataSection}>
				<div className={common.flexColumnGapHalf}>
					<PayGapTable
						caption="Écart de rémunération"
						columnHeader="Rémunération"
						onRowChange={handleRowChange}
						rows={rows}
					/>

					{gipPrefillData && (
						<PrefillSource
							periodEnd={gipPrefillData.periodEnd}
							tooltipId="tooltip-source-step2"
						/>
					)}
				</div>

				<DefinitionAccordion
					id="accordion-step2"
					title="Définitions et méthode de calcul"
				/>
			</div>

			{gipPrefillData && <GapInterpretationCallout rows={rows} />}

			{validationError && (
				<div aria-live="polite" className="fr-alert fr-alert--error">
					<p>{validationError}</p>
				</div>
			)}

			{mutation.error && (
				<div aria-live="polite" className="fr-alert fr-alert--error">
					<p>{mutation.error.message}</p>
				</div>
			)}

			<FormActions
				className="fr-mt-0"
				isSubmitting={mutation.isPending}
				previousHref="/declaration-remuneration/etape/1"
			/>
		</form>
	);
}
