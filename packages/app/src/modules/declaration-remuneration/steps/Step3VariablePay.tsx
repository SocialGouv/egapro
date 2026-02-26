"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import { api } from "~/trpc/react";
import common from "../shared/common.module.scss";
import { DefinitionAccordion } from "../shared/DefinitionAccordion";
import { FormActions } from "../shared/FormActions";
import { SavedIndicator } from "../shared/SavedIndicator";
import { StepIndicator } from "../shared/StepIndicator";
import { TooltipButton } from "../shared/TooltipButton";
import {
	GAP_LEVEL_LABELS,
	computeGap,
	computeProportion,
	formatGap,
	gapBadgeClass,
	gapLevel,
} from "../shared/gapUtils";
import type { PayGapRow, VariablePayData } from "../types";
import { BeneficiaryEditDialog } from "./step3/BeneficiaryEditDialog";
import { PayGapEditDialog } from "./step3/PayGapEditDialog";

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
	const payDialogRef = useRef<HTMLDialogElement>(null);
	const benefDialogRef = useRef<HTMLDialogElement>(null);

	const [rows, setRows] = useState<PayGapRow[]>(
		initialData?.rows?.length ? initialData.rows : DEFAULT_ROWS,
	);
	const [beneficiaryWomen, setBeneficiaryWomen] = useState(
		initialData?.beneficiaryWomen ?? "",
	);
	const [beneficiaryMen, setBeneficiaryMen] = useState(
		initialData?.beneficiaryMen ?? "",
	);

	const [editIndex, setEditIndex] = useState<number | null>(null);
	const [editWomenValue, setEditWomenValue] = useState("");
	const [editMenValue, setEditMenValue] = useState("");

	const [editBenefWomen, setEditBenefWomen] = useState("");
	const [editBenefMen, setEditBenefMen] = useState("");
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

	function handleIntegerChange(setter: (v: string) => void, max?: number) {
		return (e: React.ChangeEvent<HTMLInputElement>) => {
			const val = e.target.value;
			if (val === "") {
				setter(val);
				setBenefValidationError(null);
				return;
			}
			const n = Number.parseInt(val, 10);
			if (Number.isNaN(n) || n < 0) return;
			if (max !== undefined && n > max) {
				setBenefValidationError(
					`Le nombre de bénéficiaires ne peut pas dépasser l'effectif de l'étape 1 (${max}).`,
				);
				return;
			}
			setBenefValidationError(null);
			setter(val);
		};
	}

	// Pay gap modal
	function openPayEditModal(index: number) {
		setEditIndex(index);
		setEditWomenValue(rows[index]?.womenValue ?? "");
		setEditMenValue(rows[index]?.menValue ?? "");
		payDialogRef.current?.showModal();
	}

	const closePayDialog = useCallback(() => {
		payDialogRef.current?.close();
	}, []);

	function handleSavePayEdit() {
		if (editIndex === null) return;
		setRows((prev) =>
			prev.map((row, i) =>
				i === editIndex
					? { ...row, womenValue: editWomenValue, menValue: editMenValue }
					: row,
			),
		);
		setSaved(false);
		closePayDialog();
	}

	// Beneficiary modal
	function openBenefEditModal() {
		setEditBenefWomen(beneficiaryWomen);
		setEditBenefMen(beneficiaryMen);
		setBenefValidationError(null);
		benefDialogRef.current?.showModal();
	}

	const closeBenefDialog = useCallback(() => {
		benefDialogRef.current?.close();
	}, []);

	function handleSaveBenefEdit() {
		setBeneficiaryWomen(editBenefWomen);
		setBeneficiaryMen(editBenefMen);
		setSaved(false);
		closeBenefDialog();
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

	const editGap =
		editWomenValue && editMenValue
			? computeGap(editWomenValue, editMenValue)
			: null;

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

			<p className={`fr-mb-3w ${common.fontMedium}`}>
				Vérifiez les informations préremplies et modifiez-les si elles sont
				incorrectes avant de valider vos indicateurs.
				<TooltipButton
					id="tooltip-step3-info"
					label="Information sur les indicateurs"
				/>
			</p>

			{/* Table 1 - Variable pay gap */}
			<div className="fr-table fr-table--no-caption fr-mb-1w">
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
											<strong>Rémunération variable ou complémentaire</strong>
											<br />
											<span className={common.fontRegular}>
												Montant en euros
											</span>
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
										<th scope="col">{/* actions */}</th>
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
												<td>{row.womenValue ? `${row.womenValue} €` : "-"}</td>
												<td>{row.menValue ? `${row.menValue} €` : "-"}</td>
												<td>
													{formatGap(gap)}
													{level && (
														<>
															{" "}
															<span className={gapBadgeClass(level)}>
																{GAP_LEVEL_LABELS[level]}
															</span>
														</>
													)}
												</td>
												<td>
													<button
														aria-label={`Modifier ${row.label}`}
														className="fr-btn fr-btn--tertiary-no-outline fr-icon-edit-line fr-btn--sm"
														onClick={() => openPayEditModal(i)}
														type="button"
													/>
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

			{/* Source text */}
			<p className={`fr-text--sm fr-mb-4w ${common.mentionGrey}`}>
				Source : déclarations sociales nominatives mise à jour le 27/01/2026.
				<TooltipButton
					id="tooltip-source-step3"
					label="Information sur la source"
				/>
			</p>

			{/* Table 2 - Beneficiaries */}
			<div className="fr-table fr-table--no-caption fr-mb-1w">
				<div className="fr-table__wrapper">
					<div className="fr-table__container">
						<div className="fr-table__content">
							<table>
								<caption>
									Bénéficiaires de composantes variables ou complémentaires
								</caption>
								<thead>
									<tr>
										<th scope="col">
											<strong>
												Bénéficiaires de composantes variables ou
												complémentaires
											</strong>
										</th>
										<th scope="col">Total de salariés</th>
										<th scope="col">Bénéficiaires</th>
										<th scope="col">Proportion</th>
										<th scope="col">{/* actions */}</th>
									</tr>
								</thead>
								<tbody>
									<tr>
										<td>
											<strong>Femmes</strong>
										</td>
										<td>{maxWomen ?? "-"}</td>
										<td>{beneficiaryWomen || "-"}</td>
										<td>{computeProportion(beneficiaryWomen, maxWomen)}</td>
										<td>
											<button
												aria-label="Modifier les bénéficiaires femmes"
												className="fr-btn fr-btn--tertiary-no-outline fr-icon-edit-line fr-btn--sm"
												onClick={openBenefEditModal}
												type="button"
											/>
										</td>
									</tr>
									<tr>
										<td>
											<strong>Hommes</strong>
										</td>
										<td>{maxMen ?? "-"}</td>
										<td>{beneficiaryMen || "-"}</td>
										<td>{computeProportion(beneficiaryMen, maxMen)}</td>
										<td>
											<button
												aria-label="Modifier les bénéficiaires hommes"
												className="fr-btn fr-btn--tertiary-no-outline fr-icon-edit-line fr-btn--sm"
												onClick={openBenefEditModal}
												type="button"
											/>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
				</div>
			</div>

			<DefinitionAccordion id="accordion-step3" />

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

			{/* Pay gap edit modal */}
			<PayGapEditDialog
				dialogRef={payDialogRef}
				editGap={editGap}
				editMenValue={editMenValue}
				editWomenValue={editWomenValue}
				label={editIndex !== null ? rows[editIndex]?.label : undefined}
				onClose={closePayDialog}
				onMenChange={setEditMenValue}
				onSave={handleSavePayEdit}
				onWomenChange={setEditWomenValue}
			/>

			{/* Beneficiary edit modal */}
			<BeneficiaryEditDialog
				benefValidationError={benefValidationError}
				dialogRef={benefDialogRef}
				editBenefMen={editBenefMen}
				editBenefWomen={editBenefWomen}
				maxMen={maxMen}
				maxWomen={maxWomen}
				onClose={closeBenefDialog}
				onMenChange={handleIntegerChange(setEditBenefMen, maxMen)}
				onSave={handleSaveBenefEdit}
				onWomenChange={handleIntegerChange(setEditBenefWomen, maxWomen)}
			/>
		</form>
	);
}
