"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "~/trpc/react";
import common from "../shared/common.module.scss";
import { DefinitionAccordion } from "../shared/DefinitionAccordion";
import { FormActions } from "../shared/FormActions";
import {
	computeGap,
	displayDecimal,
	formatGap,
	GAP_LEVEL_LABELS,
	gapBadgeClass,
	gapLevel,
	normalizeDecimalInput,
} from "../shared/gapUtils";
import { SavedIndicator } from "../shared/SavedIndicator";
import { StepIndicator } from "../shared/StepIndicator";
import { TooltipButton } from "../shared/TooltipButton";
import type { PayGapRow } from "../types";
import stepStyles from "./Step2PayGap.module.scss";

type Step2PayGapProps = {
	initialRows?: PayGapRow[];
};

const DEFAULT_ROWS: PayGapRow[] = [
	{ label: "Annuelle brute moyenne", womenValue: "", menValue: "" },
	{ label: "Horaire brute moyenne", womenValue: "", menValue: "" },
	{ label: "Annuelle brute médiane", womenValue: "", menValue: "" },
	{ label: "Horaire brute médiane", womenValue: "", menValue: "" },
];

export function Step2PayGap({ initialRows }: Step2PayGapProps) {
	const router = useRouter();

	const [rows, setRows] = useState<PayGapRow[]>(
		initialRows?.length ? initialRows : DEFAULT_ROWS,
	);

	const hasInitialData =
		initialRows?.some((r) => r.womenValue || r.menValue) ?? false;
	const [saved, setSaved] = useState(hasInitialData);
	const [validationError, setValidationError] = useState<string | null>(null);

	const currentYear = new Date().getFullYear();

	const mutation = api.declaration.updateStepCategories.useMutation({
		onSuccess: () => router.push("/declaration-remuneration/etape/3"),
	});

	function handleValueChange(
		index: number,
		field: "womenValue" | "menValue",
		value: string,
	) {
		const normalized = normalizeDecimalInput(value);
		if (normalized === null) return;
		if (normalized !== "" && Number.parseFloat(normalized) < 0) return;
		setRows((prev) =>
			prev.map((row, i) =>
				i === index ? { ...row, [field]: normalized } : row,
			),
		);
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

			{/* Editable data table */}
			<div className="fr-table fr-table--no-caption fr-mb-1w">
				<div className="fr-table__wrapper">
					<div className="fr-table__container">
						<div className="fr-table__content">
							<table>
								<caption>Écart de rémunération</caption>
								<thead>
									<tr>
										<th scope="col">Rémunération</th>
										<th scope="col">Femmes</th>
										<th scope="col">Hommes</th>
										<th scope="col">
											<strong>Écart</strong>
											<br />
											<span className={common.fontRegular}>
												Seuil réglementaire : 5%
											</span>
										</th>
									</tr>
								</thead>
								<tbody>
									{rows.map((row, i) => {
										const gap = computeGap(row.womenValue, row.menValue);
										const level = gapLevel(gap);
										return (
											<tr key={row.label}>
												<td>
													<strong>{row.label}</strong>
												</td>
												<td>
													<span className={stepStyles.inputWithUnit}>
														<input
															aria-label={`${row.label} — Femmes`}
															className="fr-input"
															inputMode="decimal"
															onChange={(e) =>
																handleValueChange(
																	i,
																	"womenValue",
																	e.target.value,
																)
															}
															type="text"
															value={displayDecimal(row.womenValue)}
														/>
														<span aria-hidden="true">€</span>
													</span>
												</td>
												<td>
													<span className={stepStyles.inputWithUnit}>
														<input
															aria-label={`${row.label} — Hommes`}
															className="fr-input"
															inputMode="decimal"
															onChange={(e) =>
																handleValueChange(i, "menValue", e.target.value)
															}
															type="text"
															value={displayDecimal(row.menValue)}
														/>
														<span aria-hidden="true">€</span>
													</span>
												</td>
												<td>
													<span className={stepStyles.gapDisplay}>
														<span className="fr-text--bold">
															{formatGap(gap)}
														</span>
														{level === "high" && (
															<span className={gapBadgeClass(level)}>
																{GAP_LEVEL_LABELS[level]}
															</span>
														)}
													</span>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>

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
