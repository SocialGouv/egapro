"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { getCurrentYear, normalizeDecimalInput } from "~/modules/domain";
import { useZodForm } from "~/modules/shared/useZodForm";
import { api } from "~/trpc/react";
import { updateStep2Schema } from "../schemas";
import common from "../shared/common.module.scss";
import { DefinitionAccordion } from "../shared/DefinitionAccordion";
import { DEV_STEP2_ROWS } from "../shared/devFillData";
import { FormActions } from "../shared/FormActions";
import { FormErrors } from "../shared/FormErrors";
import { GapInterpretationCallout } from "../shared/GapInterpretationCallout";
import type { GipPrefillData } from "../shared/gipMdsMapping";
import { gipToStep2 } from "../shared/gipToStepData";
import { getStep2FieldName, step2ToRows } from "../shared/indicatorRowMapping";
import { DEFAULT_PAY_GAP_ROWS, PayGapTable } from "../shared/PayGapTable";
import { PrefillSource } from "../shared/PrefillSource";
import { StepIndicator } from "../shared/StepIndicator";
import { StepTitleRow } from "../shared/StepTitleRow";
import { TooltipButton } from "../shared/TooltipButton";
import type { PayGapField, Step2Data } from "../types";

type Step2PayGapProps = {
	initialData: Step2Data;
	gipPrefillData?: GipPrefillData;
};

export function Step2PayGap({ initialData, gipPrefillData }: Step2PayGapProps) {
	const router = useRouter();

	const hasSavedData = Object.values(initialData).some((v) => v !== "");
	const defaultValues = hasSavedData
		? initialData
		: gipPrefillData
			? gipToStep2(gipPrefillData.step2)
			: initialData;

	const hasInitialData = hasSavedData;

	const form = useZodForm(updateStep2Schema, { defaultValues });

	const formData = form.watch();
	const rows = step2ToRows(formData as Step2Data);

	const [saved, setSaved] = useState(hasInitialData);
	const [validationError, setValidationError] = useState<string | null>(null);

	const currentYear = getCurrentYear();

	const mutation = api.declaration.updateStep2.useMutation({
		onSuccess: () => router.push("/declaration-remuneration/etape/3"),
	});

	function handleRowChange(index: number, field: PayGapField, value: string) {
		const normalized = normalizeDecimalInput(value);
		if (normalized === null) return;
		if (normalized !== "" && Number.parseFloat(normalized) < 0) return;
		const fieldName = getStep2FieldName(index, field);
		form.setValue(fieldName, normalized);
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
		mutation.mutate(form.getValues() as Step2Data);
	});

	return (
		<form className={common.flexColumnGap2} onSubmit={onSubmit}>
			<StepTitleRow
				onDevFill={() => {
					DEV_STEP2_ROWS.forEach((row, i) => {
						const womenField = getStep2FieldName(i, "womenValue");
						const menField = getStep2FieldName(i, "menValue");
						form.setValue(womenField, row.womenValue);
						form.setValue(menField, row.menValue);
					});
					setSaved(false);
				}}
				saved={saved}
				title={
					<h1 className="fr-h4 fr-mb-0">
						Déclaration des indicateurs de rémunération {currentYear}
					</h1>
				}
			/>

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

			<FormErrors
				mutationError={mutation.error?.message}
				validationError={validationError}
			/>

			<FormActions
				className="fr-mt-0"
				isSubmitting={mutation.isPending}
				previousHref="/declaration-remuneration/etape/1"
			/>
		</form>
	);
}
