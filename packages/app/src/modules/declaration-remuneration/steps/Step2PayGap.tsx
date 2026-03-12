"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "~/trpc/react";
import { DefinitionAccordion } from "../shared/DefinitionAccordion";
import { DevFillButton } from "../shared/DevFillButton";
import { DEV_STEP2_ROWS } from "../shared/devFillData";
import { FormActions } from "../shared/FormActions";
import {
	DEFAULT_PAY_GAP_ROWS,
	handlePayGapRowChange,
	PayGapTable,
} from "../shared/PayGapTable";
import { SavedIndicator } from "../shared/SavedIndicator";
import { StepIndicator } from "../shared/StepIndicator";
import { TooltipButton } from "../shared/TooltipButton";
import type { PayGapField, PayGapRow } from "../types";

type Step2PayGapProps = {
	initialRows?: PayGapRow[];
};

export function Step2PayGap({ initialRows }: Step2PayGapProps) {
	const router = useRouter();

	const [rows, setRows] = useState<PayGapRow[]>(
		initialRows?.length ? initialRows : DEFAULT_PAY_GAP_ROWS,
	);

	const hasInitialData =
		initialRows?.some((r) => r.womenValue || r.menValue) ?? false;
	const [saved, setSaved] = useState(hasInitialData);
	const [validationError, setValidationError] = useState<string | null>(null);

	const currentYear = new Date().getFullYear();

	const mutation = api.declaration.updateStepCategories.useMutation({
		onSuccess: () => router.push("/declaration-remuneration/etape/3"),
	});

	function handleRowChange(index: number, field: PayGapField, value: string) {
		const updated = handlePayGapRowChange(rows, index, field, value);
		if (!updated) return;
		setRows(updated);
		setSaved(false);
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
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
			categories: rows.map((r) => ({
				name: r.label,
				womenValue: r.womenValue,
				menValue: r.menValue,
			})),
		});
	}

	return (
		<form onSubmit={handleSubmit}>
			{/* Title + save status */}
			<div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters fr-mb-3w">
				<div className="fr-col">
					<h1 className="fr-h4 fr-mb-0">
						Déclaration des indicateurs de rémunération {currentYear}
					</h1>
				</div>
				<div className="fr-col-auto">
					<DevFillButton onFill={() => setRows(DEV_STEP2_ROWS)} />
				</div>
				{saved && (
					<div className="fr-col-auto">
						<SavedIndicator />
					</div>
				)}
			</div>

			<StepIndicator currentStep={2} />

			{/* Description */}
			<p className="fr-mb-2w">
				Ces indicateurs mesurent la différence de rémunération, moyenne et
				médiane, entre les femmes et les hommes, exprimée en pourcentage du
				salaire masculin correspondant. Ils couvrent l&apos;ensemble de la
				rémunération : la partie fixe ainsi que les composantes variables ou
				complémentaires.
			</p>

			<p className="fr-mb-1w">
				<strong>
					Renseignez les informations avant de valider vos indicateurs.
				</strong>
				<TooltipButton
					id="tooltip-step2-info"
					label="Information sur les indicateurs"
				/>
			</p>

			<p className="fr-text--sm fr-mb-3w">Tous les champs sont obligatoires.</p>

			<PayGapTable
				caption="Écart de rémunération"
				columnHeader="Rémunération"
				onRowChange={handleRowChange}
				rows={rows}
			/>

			<DefinitionAccordion
				id="accordion-step2"
				title="Définitions et méthode de calcul"
			/>

			{validationError && (
				<div aria-live="polite" className="fr-alert fr-alert--error fr-mt-2w">
					<p>{validationError}</p>
				</div>
			)}

			{mutation.error && (
				<div aria-live="polite" className="fr-alert fr-alert--error fr-mt-2w">
					<p>{mutation.error.message}</p>
				</div>
			)}

			<FormActions
				isSubmitting={mutation.isPending}
				previousHref="/declaration-remuneration/etape/1"
			/>
		</form>
	);
}
