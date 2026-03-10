"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "~/trpc/react";
import common from "../shared/common.module.scss";
import { DefinitionAccordion } from "../shared/DefinitionAccordion";
import { FormActions } from "../shared/FormActions";
import {
	computeGap,
	computeProportion,
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
import type { PayGapRow, VariablePayData } from "../types";
import stepStyles from "./Step3VariablePay.module.scss";

type Step3VariablePayProps = {
	initialData?: VariablePayData;
	maxWomen?: number;
	maxMen?: number;
};

const DEFAULT_ROWS: PayGapRow[] = [
	{ label: "Annuelle brute moyenne", womenValue: "", menValue: "" },
	{ label: "Horaire brute moyenne", womenValue: "", menValue: "" },
	{ label: "Annuelle brute médiane", womenValue: "", menValue: "" },
	{ label: "Horaire brute médiane", womenValue: "", menValue: "" },
];

export function Step3VariablePay({
	initialData,
	maxWomen,
	maxMen,
}: Step3VariablePayProps) {
	const router = useRouter();

	const [rows, setRows] = useState<PayGapRow[]>(
		initialData?.rows?.length ? initialData.rows : DEFAULT_ROWS,
	);
	const [beneficiaryWomen, setBeneficiaryWomen] = useState(
		initialData?.beneficiaryWomen ?? "",
	);
	const [beneficiaryMen, setBeneficiaryMen] = useState(
		initialData?.beneficiaryMen ?? "",
	);

	const [benefValidationError, setBenefValidationError] = useState<
		string | null
	>(null);

	const hasInitialData =
		(initialData?.rows?.some((r) => r.womenValue || r.menValue) ||
			initialData?.beneficiaryWomen ||
			initialData?.beneficiaryMen) ??
		false;
	const [saved, setSaved] = useState(hasInitialData);
	const [validationError, setValidationError] = useState<string | null>(null);

	const currentYear = new Date().getFullYear();

	const mutation = api.declaration.updateStepCategories.useMutation({
		onSuccess: () => router.push("/declaration-remuneration/etape/4"),
	});

	function handleRowChange(
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

	function handleBenefChange(
		setter: (v: string) => void,
		max: number | undefined,
		value: string,
	) {
		if (value === "") {
			setter(value);
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
		setter(value);
		setSaved(false);
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
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
				...rows.map((r) => ({
					name: r.label,
					womenValue: r.womenValue,
					menValue: r.menValue,
				})),
				{
					name: "Bénéficiaires",
					womenValue: beneficiaryWomen,
					menValue: beneficiaryMen,
				},
			],
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

			<StepIndicator currentStep={3} />

			{/* Description */}
			<p className="fr-mb-2w">
				Ces indicateurs évaluent et comparent les rémunérations variables
				(primes, bonus, avantages…) entre les femmes et les hommes. Ils mesurent
				à la fois l&apos;écart moyen et médian des montants perçus ainsi que la
				proportion de femmes et d&apos;hommes bénéficiant de ces rémunérations.
			</p>

			<p className="fr-mb-1w">
				<strong>
					Renseignez les informations avant de valider vos indicateurs.
				</strong>
				<TooltipButton
					id="tooltip-step3-info"
					label="Information sur les indicateurs"
				/>
			</p>

			<p className="fr-text--sm fr-mb-3w">Tous les champs sont obligatoires.</p>

			{/* Table 1 - Variable pay gap */}
			<div
				className={`fr-table fr-table--no-caption fr-mb-1w ${stepStyles.payGapTable}`}
			>
				<div className="fr-table__wrapper">
					<div className="fr-table__container">
						<div className="fr-table__content">
							<table>
								<caption>
									Écart de rémunération variable ou complémentaire
								</caption>
								<thead>
									<tr>
										<th scope="col">
											Rémunération variable
											<br />
											ou complémentaire
										</th>
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
																handleRowChange(i, "womenValue", e.target.value)
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
																handleRowChange(i, "menValue", e.target.value)
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

			{/* Table 2 - Beneficiaries */}
			<div
				className={`fr-table fr-table--no-caption fr-mb-1w ${stepStyles.payGapTable}`}
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
										<th scope="col">Total de salariés</th>
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
										<td>{maxWomen ?? "-"}</td>
										<td>
											<input
												aria-label="Bénéficiaires femmes"
												className="fr-input"
												max={maxWomen}
												min="0"
												onChange={(e) =>
													handleBenefChange(
														setBeneficiaryWomen,
														maxWomen,
														e.target.value,
													)
												}
												type="number"
												value={beneficiaryWomen}
											/>
										</td>
										<td>{computeProportion(beneficiaryWomen, maxWomen)}</td>
									</tr>
									<tr>
										<td>
											<strong>Hommes</strong>
										</td>
										<td>{maxMen ?? "-"}</td>
										<td>
											<input
												aria-label="Bénéficiaires hommes"
												className="fr-input"
												max={maxMen}
												min="0"
												onChange={(e) =>
													handleBenefChange(
														setBeneficiaryMen,
														maxMen,
														e.target.value,
													)
												}
												type="number"
												value={beneficiaryMen}
											/>
										</td>
										<td>{computeProportion(beneficiaryMen, maxMen)}</td>
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
					className="fr-alert fr-alert--error fr-alert--sm fr-mb-3w"
				>
					<p>{benefValidationError}</p>
				</div>
			)}

			<DefinitionAccordion
				id="accordion-step3"
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
				previousHref="/declaration-remuneration/etape/2"
			/>
		</form>
	);
}
