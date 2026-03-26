"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { computeProportion, getCurrentYear } from "~/modules/domain";
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
import {
	DEV_STEP3_BENEFICIARY_MEN,
	DEV_STEP3_BENEFICIARY_WOMEN,
	DEV_STEP3_ROWS,
} from "../shared/devFillData";
import { FormActions } from "../shared/FormActions";
import { FormErrors } from "../shared/FormErrors";
import { GapInterpretationCallout } from "../shared/GapInterpretationCallout";
import type { GipPrefillData } from "../shared/gipMdsMapping";
import {
	DEFAULT_PAY_GAP_ROWS,
	handlePayGapRowChange,
	PayGapTable,
} from "../shared/PayGapTable";
import { PrefillSource } from "../shared/PrefillSource";
import { StepIndicator } from "../shared/StepIndicator";
import { StepTitleRow } from "../shared/StepTitleRow";
import { TooltipButton } from "../shared/TooltipButton";
import type { PayGapField, VariablePayData } from "../types";
import stepStyles from "./Step3VariablePay.module.scss";

type Step3VariablePayProps = {
	initialData?: VariablePayData;
	gipPrefillData?: GipPrefillData;
	maxWomen?: number;
	maxMen?: number;
};

export function Step3VariablePay({
	initialData,
	gipPrefillData,
	maxWomen,
	maxMen,
}: Step3VariablePayProps) {
	const router = useRouter();

	const hasSavedRows = !!initialData?.rows?.length;
	const defaultRows = hasSavedRows
		? initialData.rows
		: gipPrefillData
			? buildGipRows(gipPrefillData.step3)
			: DEFAULT_PAY_GAP_ROWS;

	const defaultBenefWomen =
		initialData?.beneficiaryWomen ||
		(gipPrefillData?.step3.beneficiaryCountWomen?.toString() ?? "");
	const defaultBenefMen =
		initialData?.beneficiaryMen ||
		(gipPrefillData?.step3.beneficiaryCountMen?.toString() ?? "");

	const hasInitialData = !!(
		initialData?.rows?.some((r) => r.womenValue || r.menValue) ||
		initialData?.beneficiaryWomen ||
		initialData?.beneficiaryMen
	);

	const form = useZodForm(updateStepCategoriesSchema, {
		defaultValues: {
			step: 3,
			categories: [
				...rowsToCategories(defaultRows),
				{
					name: "Bénéficiaires",
					womenValue: defaultBenefWomen,
					menValue: defaultBenefMen,
				},
			],
		},
	});

	const allCategories = form.watch("categories");
	const payGapCategories = allCategories.slice(0, -1);
	const benefCategory = allCategories[allCategories.length - 1];
	const rows = categoriesToRows(payGapCategories);
	const beneficiaryWomen = benefCategory?.womenValue ?? "";
	const beneficiaryMen = benefCategory?.menValue ?? "";

	const [benefValidationError, setBenefValidationError] = useState<
		string | null
	>(null);
	const [saved, setSaved] = useState(hasInitialData);
	const [validationError, setValidationError] = useState<string | null>(null);

	const currentYear = getCurrentYear();

	const mutation = api.declaration.updateStepCategories.useMutation({
		onSuccess: () => router.push("/declaration-remuneration/etape/4"),
	});

	function handleRowChange(index: number, field: PayGapField, value: string) {
		const updated = handlePayGapRowChange(rows, index, field, value);
		if (!updated) return;
		form.setValue("categories", [
			...rowsToCategories(updated),
			{
				name: "Bénéficiaires",
				womenValue: beneficiaryWomen,
				menValue: beneficiaryMen,
			},
		]);
		setSaved(false);
	}

	function handleBenefChange(
		field: "womenValue" | "menValue",
		max: number | undefined,
		value: string,
	) {
		if (value === "") {
			form.setValue(`categories.${allCategories.length - 1}.${field}`, "");
			setBenefValidationError(null);
			return;
		}
		const n = Number.parseInt(value, 10);
		if (Number.isNaN(n) || n < 0) return;
		if (max !== undefined && n > max) {
			setBenefValidationError(
				`Le nombre de bénéficiaires ne peut pas dépasser l'effectif de l'étape 1 (${max}).`,
			);
			return;
		}
		setBenefValidationError(null);
		form.setValue(`categories.${allCategories.length - 1}.${field}`, value);
		setSaved(false);
	}

	const onSubmit = form.handleSubmit(() => {
		const incompleteRows = rows.some((r) => !r.womenValue || !r.menValue);
		const incompleteBeneficiaries = !beneficiaryWomen || !beneficiaryMen;
		if (incompleteRows || incompleteBeneficiaries) {
			setValidationError(
				"Veuillez renseigner toutes les données avant de passer à l'étape suivante.",
			);
			return;
		}
		setValidationError(null);
		mutation.mutate({
			step: 3,
			categories: [
				...rowsToCategories(rows),
				{
					name: "Bénéficiaires",
					womenValue: beneficiaryWomen,
					menValue: beneficiaryMen,
				},
			],
		});
	});

	return (
		<form className={common.flexColumnGap2} onSubmit={onSubmit}>
			<StepTitleRow
				onDevFill={() => {
					form.setValue("categories", [
						...rowsToCategories(DEV_STEP3_ROWS),
						{
							name: "Bénéficiaires",
							womenValue: DEV_STEP3_BENEFICIARY_WOMEN,
							menValue: DEV_STEP3_BENEFICIARY_MEN,
						},
					]);
					setSaved(false);
				}}
				saved={saved}
				title={
					<h1 className="fr-h4 fr-mb-0">
						Déclaration des indicateurs de rémunération {currentYear}
					</h1>
				}
			/>

			<StepIndicator currentStep={3} />

			{/* Introduction */}
			<div className={common.flexColumnGap1}>
				<p className="fr-mb-0">
					Ces indicateurs évaluent et comparent les rémunérations variables
					(primes, bonus, avantages…) entre les femmes et les hommes. Ils
					mesurent à la fois l&apos;écart moyen et médian des montants perçus
					ainsi que la proportion de femmes et d&apos;hommes bénéficiant de ces
					rémunérations.
				</p>

				<p className="fr-mb-0">
					<strong>
						{gipPrefillData
							? "Vérifiez les informations préremplies à partir de vos données DSN et modifiez-les si nécessaire avant de valider vos indicateurs (en cas d'erreur, pensez à corriger votre DSN)."
							: "Renseignez les informations avant de valider vos indicateurs."}
					</strong>
					<TooltipButton
						id="tooltip-step3-info"
						label="Information sur les indicateurs"
					/>
				</p>

				<p className="fr-mb-0">Tous les champs sont obligatoires.</p>
			</div>

			{/* Data section */}
			<div className={common.dataSection}>
				{/* Table 1 - Variable pay gap + source */}
				<div className={common.flexColumnGapHalf}>
					<PayGapTable
						caption="Écart de rémunération variable ou complémentaire"
						className={stepStyles.payGapTable}
						columnHeader={
							<>
								Rémunération variable
								<br />
								ou complémentaire
							</>
						}
						onRowChange={handleRowChange}
						rows={rows}
					/>

					{gipPrefillData && (
						<PrefillSource
							periodEnd={gipPrefillData.periodEnd}
							tooltipId="tooltip-source-step3-paygap"
						/>
					)}
				</div>

				{/* Table 2 - Beneficiaries + source */}
				<div className={common.flexColumnGapHalf}>
					<div
						className={`fr-table fr-table--no-caption fr-mt-0 fr-mb-0 ${stepStyles.payGapTable}`}
					>
						<div className="fr-table__wrapper">
							<div className="fr-table__container">
								<div className="fr-table__content">
									<table>
										<caption>
											Bénéficiaires de composantes variables ou complémentaires
										</caption>
										<thead>
											<tr>
												<th scope="col">Sexe</th>
												<th scope="col">
													Total de salariés
													{maxWomen !== undefined && maxMen !== undefined
														? ` : ${maxWomen + maxMen}`
														: ""}
												</th>
												<th scope="col">
													Bénéficiaires de composantes
													<br />
													variables ou complémentaires
												</th>
												<th scope="col">Proportion</th>
											</tr>
										</thead>
										<tbody>
											<tr>
												<td>
													<strong>Femmes</strong>
												</td>
												<td>
													<strong>{maxWomen ?? "-"}</strong>
												</td>
												<td>
													<input
														aria-label="Bénéficiaires femmes"
														className="fr-input"
														max={maxWomen}
														min="0"
														onChange={(e) =>
															handleBenefChange(
																"womenValue",
																maxWomen,
																e.target.value,
															)
														}
														type="number"
														value={beneficiaryWomen}
													/>
												</td>
												<td>
													<strong>
														{computeProportion(beneficiaryWomen, maxWomen)}
													</strong>
												</td>
											</tr>
											<tr>
												<td>
													<strong>Hommes</strong>
												</td>
												<td>
													<strong>{maxMen ?? "-"}</strong>
												</td>
												<td>
													<input
														aria-label="Bénéficiaires hommes"
														className="fr-input"
														max={maxMen}
														min="0"
														onChange={(e) =>
															handleBenefChange(
																"menValue",
																maxMen,
																e.target.value,
															)
														}
														type="number"
														value={beneficiaryMen}
													/>
												</td>
												<td>
													<strong>
														{computeProportion(beneficiaryMen, maxMen)}
													</strong>
												</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>
						</div>
					</div>

					{benefValidationError && (
						<div
							aria-live="polite"
							className="fr-alert fr-alert--error fr-alert--sm"
						>
							<p>{benefValidationError}</p>
						</div>
					)}

					{gipPrefillData && (
						<PrefillSource
							periodEnd={gipPrefillData.periodEnd}
							tooltipId="tooltip-source-step3"
						/>
					)}
				</div>

				<DefinitionAccordion
					id="accordion-step3"
					title="Définitions et méthode de calcul"
				/>
			</div>

			{gipPrefillData && (
				<GapInterpretationCallout
					beneficiaryMen={beneficiaryMen}
					beneficiaryWomen={beneficiaryWomen}
					maxMen={maxMen}
					maxWomen={maxWomen}
					rows={rows}
					variant="variablePay"
				/>
			)}

			<FormErrors
				mutationError={mutation.error?.message}
				validationError={validationError}
			/>

			<FormActions
				className="fr-mt-0"
				isSubmitting={mutation.isPending}
				previousHref="/declaration-remuneration/etape/2"
			/>
		</form>
	);
}
