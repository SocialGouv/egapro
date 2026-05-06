"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useIsImpersonating } from "~/modules/auth";
import { normalizeDecimalInput, padDecimalToTwo } from "~/modules/domain";
import { useZodForm } from "~/modules/shared/useZodForm";
import { api } from "~/trpc/react";
import { updateStep2Schema } from "../schemas";
import common from "../shared/common.module.scss";
import { DefinitionAccordion } from "../shared/DefinitionAccordion";
import { DEV_STEP2_ROWS } from "../shared/devFillData";
import { useDeclarationDraft } from "../shared/draft/useDeclarationDraft";
import { FormActions } from "../shared/FormActions";
import { FormErrors } from "../shared/FormErrors";
import { GapInterpretationCallout } from "../shared/GapInterpretationCallout";
import type { GipPrefillData } from "../shared/gipMdsMapping";
import { gipToStep2 } from "../shared/gipToStepData";
import { getStep2FieldName, step2ToRows } from "../shared/indicatorRowMapping";
import { PayGapTable } from "../shared/PayGapTable";
import { PrefillSource } from "../shared/PrefillSource";
import { StepIndicator } from "../shared/StepIndicator";
import { StepTitleRow } from "../shared/StepTitleRow";
import { TooltipButton } from "../shared/TooltipButton";
import type { PayGapField, Step2Data } from "../types";

type Step2PayGapProps = {
	declarationSiren: string;
	declarationYear: number;
	initialData: Step2Data;
	gipPrefillData?: GipPrefillData;
};

export function Step2PayGap({
	declarationSiren,
	declarationYear,
	initialData,
	gipPrefillData,
}: Step2PayGapProps) {
	const router = useRouter();
	const isImpersonating = useIsImpersonating();

	const hasSavedData = Object.values(initialData).some((v) => v !== "");
	const rawDefaults = hasSavedData
		? initialData
		: gipPrefillData
			? gipToStep2(gipPrefillData.step2)
			: initialData;
	const defaultValues = Object.fromEntries(
		Object.entries(rawDefaults).map(([k, v]) => [k, padDecimalToTwo(v)]),
	) as Step2Data;

	const hasInitialData = hasSavedData;

	const dbValues = useMemo(
		() =>
			Object.fromEntries(
				Object.entries(initialData).map(([k, v]) => [k, padDecimalToTwo(v)]),
			) as Step2Data,
		[initialData],
	);

	const { draft, setField, clearDraft, hasDraft } = useDeclarationDraft({
		siren: declarationSiren,
		year: declarationYear,
		step: 2,
		kind: "main",
		dbValues,
	});

	const form = useZodForm(updateStep2Schema, { defaultValues });

	useEffect(() => {
		(Object.keys(draft) as Array<keyof Step2Data>).forEach((key) => {
			const value = draft[key];
			if (value !== undefined) form.setValue(key, value as string);
		});
	}, [draft, form]);

	useEffect(() => {
		const sub = form.watch((values) => setField(values as Step2Data));
		return () => sub.unsubscribe();
	}, [form, setField]);

	const formData = form.watch();
	const rows = step2ToRows(formData as Step2Data);

	const saved = !hasDraft && hasInitialData;
	const [validationError, setValidationError] = useState<string | null>(null);

	const mutation = api.declaration.updateStep2.useMutation({
		onSuccess: () => {
			clearDraft();
			router.push("/declaration-remuneration/etape/3");
		},
	});

	function handleRowChange(index: number, field: PayGapField, value: string) {
		const normalized = normalizeDecimalInput(value);
		if (normalized === null) return;
		if (normalized !== "" && Number.parseFloat(normalized) < 0) return;
		const fieldName = getStep2FieldName(index, field);
		form.setValue(fieldName, normalized);
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
						form.setValue(womenField, padDecimalToTwo(row.womenValue));
						form.setValue(menField, padDecimalToTwo(row.menValue));
					});
				}}
				saved={saved}
				title={
					<h1 className="fr-h4 fr-mb-0">
						Déclaration des indicateurs de rémunération {declarationYear}
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

				<p className={`fr-mb-0 ${common.fontMedium}`}>
					{gipPrefillData
						? "Vérifiez les informations préremplies et modifiez-les si nécessaire avant de valider vos indicateurs (en cas d'erreur, pensez à corriger votre DSN)."
						: "Renseignez les informations avant de valider vos indicateurs."}
					{!gipPrefillData && (
						<TooltipButton
							id="tooltip-step2-info"
							label="Information sur la confidentialité des données"
							text="Les informations saisies sont confidentielles et utilisées uniquement pour le calcul des indicateurs d'égalité professionnelle."
						/>
					)}
				</p>

				<p className="fr-mb-0">Tous les champs sont obligatoires.</p>
			</div>

			{/* Data section */}
			<div className={common.dataSection}>
				<div className={common.flexColumnGapHalf}>
					<PayGapTable
						caption="Écart de rémunération"
						columnHeader="Rémunération"
						disabled={isImpersonating}
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
				>
					<div className="fr-callout">
						<ul>
							<li>
								Quelles composantes variables ou complémentaires sont incluses
								dans le calcul (ex. prime de cooptation, prime d&apos;astreinte,
								prime d&apos;avancement) et avec quel niveau de détail&nbsp;?
							</li>
							<li>
								Comment les rémunérations sont-elles reconstituées à partir des
								données disponibles&nbsp;?
							</li>
							<li>
								Comment expliquer l&apos;écart entre les pourcentages annuels et
								horaires (ex. ×12 = annuel)&nbsp;?
							</li>
							<li>
								Les données seraient-elles plus pertinentes en mensuel
								brut&nbsp;?
							</li>
							<li>
								Comment sont traitées les spécificités des UES, notamment
								lorsque&nbsp;:
							</li>
							<li>
								les salariés n&apos;ont pas tous le même nombre d&apos;heures
								pour un équivalent temps plein, certains salariés sont au
								forfait jours&nbsp;?
							</li>
						</ul>
					</div>
				</DefinitionAccordion>
			</div>

			<GapInterpretationCallout rows={rows} />

			<FormErrors
				mutationError={mutation.error?.message}
				validationError={validationError}
			/>

			<FormActions
				className="fr-mt-0"
				isSubmitting={mutation.isPending}
				mimoquageNextHref={
					hasSavedData ? "/declaration-remuneration/etape/3" : undefined
				}
				previousHref="/declaration-remuneration/etape/1"
			/>
		</form>
	);
}
