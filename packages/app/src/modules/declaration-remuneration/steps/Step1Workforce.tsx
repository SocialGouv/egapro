"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "~/trpc/react";
import common from "../shared/common.module.scss";
import { DefinitionAccordion } from "../shared/DefinitionAccordion";
import { DevFillButton } from "../shared/DevFillButton";
import { DEV_STEP1_CATEGORIES } from "../shared/devFillData";
import { FormActions } from "../shared/FormActions";
import type { GipPrefillData } from "../shared/gipMdsMapping";
import { PrefillResetWarning } from "../shared/PrefillResetWarning";
import { PrefillSource } from "../shared/PrefillSource";
import { SavedIndicator } from "../shared/SavedIndicator";
import { StepIndicator } from "../shared/StepIndicator";
import { TooltipButton } from "../shared/TooltipButton";
import type { CategoryData } from "../types";
import { DEFAULT_CATEGORIES } from "../types";
import styles from "./Step1Workforce.module.scss";

type Step1WorkforceProps = {
	initialCategories?: CategoryData[];
	gipPrefillData?: GipPrefillData;
};

export function Step1Workforce({
	initialCategories,
	gipPrefillData,
}: Step1WorkforceProps) {
	const router = useRouter();
	const isPrefilled = !!gipPrefillData;

	const [categories, setCategories] = useState<CategoryData[]>(
		initialCategories?.length
			? initialCategories
			: DEFAULT_CATEGORIES.map((name) => ({ name, women: 0, men: 0 })),
	);

	const totalWomen = categories.reduce((sum, c) => sum + c.women, 0);
	const totalMen = categories.reduce((sum, c) => sum + c.men, 0);
	const total = totalWomen + totalMen;

	const hasInitialData =
		initialCategories?.some((c) => c.women > 0 || c.men > 0) ?? false;
	const [saved, setSaved] = useState(hasInitialData);
	const [validationError, setValidationError] = useState<string | null>(null);

	const mutation = api.declaration.updateStep1.useMutation({
		onSuccess: () => router.push("/declaration-remuneration/etape/2"),
	});

	function handleWomenChange(e: React.ChangeEvent<HTMLInputElement>) {
		const value = Math.max(0, Number.parseInt(e.target.value, 10) || 0);
		setCategories([
			{ name: "Nombre de salariés", women: value, men: totalMen },
		]);
		setSaved(false);
	}

	function handleMenChange(e: React.ChangeEvent<HTMLInputElement>) {
		const value = Math.max(0, Number.parseInt(e.target.value, 10) || 0);
		setCategories([
			{ name: "Nombre de salariés", women: totalWomen, men: value },
		]);
		setSaved(false);
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (total === 0) {
			setValidationError(
				"Veuillez renseigner les effectifs avant de passer à l'étape suivante.",
			);
			return;
		}
		setValidationError(null);
		mutation.mutate({ categories });
	}

	return (
		<form className={common.flexColumnGap2} onSubmit={handleSubmit}>
			<div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters">
				<div className="fr-col">
					<h1 className="fr-h4 fr-mb-0">
						Déclarer les indicateurs pour l'ensemble des salariés et par
						catégorie salariés
					</h1>
				</div>
				<div className="fr-col-auto">
					<DevFillButton onFill={() => setCategories(DEV_STEP1_CATEGORIES)} />
				</div>
				{saved && (
					<div className="fr-col-auto">
						<SavedIndicator />
					</div>
				)}
			</div>

			<StepIndicator currentStep={1} />

			<div className={common.flexColumnGap1}>
				<p className="fr-mb-0">
					Période de référence pour le calcul des indicateurs : 01/01/2026 -
					31/12/2026.
					<TooltipButton
						id="tooltip-period"
						label="Information sur la période de référence"
					/>
				</p>

				<p className="fr-mb-0">
					<strong>
						{isPrefilled
							? "Vérifiez les informations préremplies à partir de vos données DSN et modifiez-les si nécessaire avant de valider vos indicateurs (en cas d'erreur, pensez à corriger votre DSN)."
							: "Renseignez l'effectif physique de votre entreprise."}
					</strong>
					<TooltipButton
						id="tooltip-workforce"
						label="Information sur les effectifs"
					/>
				</p>

				<p className="fr-mb-0">Tous les champs sont obligatoires.</p>
			</div>

			{isPrefilled && <PrefillResetWarning />}

			<div className={common.dataSection}>
				<div className={common.flexColumnGapHalf}>
					<div
						className={`fr-table fr-table--no-caption fr-mt-0 fr-mb-0 ${styles.workforceTable}`}
					>
						<div className="fr-table__wrapper">
							<div className="fr-table__container">
								<div className="fr-table__content">
									<table>
										<caption>
											Effectifs physiques pris en compte pour le calcul des
											indicateurs
										</caption>
										<colgroup>
											<col className={styles.labelCol} />
											<col className={styles.inputCol} />
											<col className={styles.inputCol} />
											<col className={styles.totalCol} />
										</colgroup>
										<thead>
											<tr>
												<th scope="col">{/* vide */}</th>
												<th scope="col">Femmes</th>
												<th scope="col">Hommes</th>
												<th scope="col">Total</th>
											</tr>
										</thead>
										<tbody>
											<tr>
												<td>
													<strong>Nombre de salariés</strong>
												</td>
												<td>
													<input
														aria-label="Nombre de femmes"
														className="fr-input"
														min={0}
														onChange={handleWomenChange}
														type="number"
														value={totalWomen}
													/>
												</td>
												<td>
													<input
														aria-label="Nombre d'hommes"
														className="fr-input"
														min={0}
														onChange={handleMenChange}
														type="number"
														value={totalMen}
													/>
												</td>
												<td>
													<strong>{total}</strong>
												</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>
						</div>
					</div>

					{isPrefilled && (
						<PrefillSource
							periodEnd={gipPrefillData.periodEnd}
							tooltipId="tooltip-source-step1"
						/>
					)}
				</div>

				<DefinitionAccordion
					id="accordion-step1"
					title="Définitions et méthode de calcul"
				/>
			</div>

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
				previousHref="/"
			/>
		</form>
	);
}
