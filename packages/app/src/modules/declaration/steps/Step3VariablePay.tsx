"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import { api } from "~/trpc/react";
import { DefinitionAccordion } from "../shared/DefinitionAccordion";
import { FormActions } from "../shared/FormActions";
import { SavedIndicator } from "../shared/SavedIndicator";
import { StepIndicator } from "../shared/StepIndicator";
import { TooltipButton } from "../shared/TooltipButton";
import type { PayGapRow, VariablePayData } from "../types";

interface Step3VariablePayProps {
	initialData?: VariablePayData;
	maxWomen?: number;
	maxMen?: number;
}

const DEFAULT_ROWS: PayGapRow[] = [
	{ label: "Annuelle brute moyenne", womenValue: "", menValue: "" },
	{ label: "Horaire brute moyenne", womenValue: "", menValue: "" },
	{ label: "Annuelle brute médiane", womenValue: "", menValue: "" },
	{ label: "Horaire brute médiane", womenValue: "", menValue: "" },
];

function parseNumber(value: string): number {
	return Number.parseFloat(value.replace(/\s/g, "").replace(",", "."));
}

function computeGap(women: string, men: string): number | null {
	const w = parseNumber(women);
	const m = parseNumber(men);
	if (!w || !m || m === 0) return null;
	return Math.abs(((m - w) / m) * 100);
}

function formatGap(gap: number | null): string {
	if (gap === null) return "-";
	return `${gap.toFixed(1).replace(".", ",")} %`;
}

function gapLevel(gap: number | null): "faible" | "élevé" | null {
	if (gap === null) return null;
	return gap < 5 ? "faible" : "élevé";
}

function computeProportion(count: string, total?: number): string {
	const n = Number.parseInt(count, 10);
	if (Number.isNaN(n) || !total || total === 0) return "-";
	return `${((n / total) * 100).toFixed(1).replace(".", ",")} %`;
}

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

	function handlePositiveChange(setter: (v: string) => void) {
		return (e: React.ChangeEvent<HTMLInputElement>) => {
			const val = e.target.value;
			if (val === "" || Number.parseFloat(val) >= 0) {
				setter(val);
			}
		};
	}

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

			<p className="fr-mb-3w" style={{ fontWeight: 500 }}>
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
											<span style={{ fontWeight: 400 }}>Montant en euros</span>
										</th>
										<th scope="col">Femmes</th>
										<th scope="col">Hommes</th>
										<th scope="col">
											<strong>Écart</strong>
											<br />
											<span style={{ fontWeight: 400 }}>
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
															<span
																className={`fr-badge fr-badge--sm fr-badge--no-icon ${level === "faible" ? "fr-badge--info" : "fr-badge--warning"}`}
															>
																{level}
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
			<p
				className="fr-text--sm fr-mb-4w"
				style={{ color: "var(--text-mention-grey)" }}
			>
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
			<dialog
				aria-labelledby="edit-variable-pay-title"
				className="fr-p-4w"
				ref={payDialogRef}
				style={{
					maxWidth: "36rem",
					borderRadius: "0.25rem",
					border: "none",
					boxShadow: "0 6px 18px 0 rgba(0, 0, 18, 0.16)",
				}}
			>
				<div className="fr-grid-row fr-grid-row--right fr-mb-2w">
					<button
						aria-label="Fermer"
						className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-icon-close-line"
						onClick={closePayDialog}
						type="button"
					/>
				</div>

				<h2 className="fr-h4" id="edit-variable-pay-title">
					Modifier les données
				</h2>

				{editIndex !== null && (
					<p className="fr-text--bold fr-mb-1v">{rows[editIndex]?.label}</p>
				)}
				<p
					className="fr-text--sm fr-mb-3w"
					style={{ color: "var(--text-mention-grey)" }}
				>
					Tous les champs sont obligatoires
				</p>

				<div className="fr-input-group fr-mb-3w">
					<label className="fr-label" htmlFor="edit-women-variable-pay">
						Rémunération Femmes
					</label>
					<input
						className="fr-input"
						id="edit-women-variable-pay"
						min="0"
						onChange={handlePositiveChange(setEditWomenValue)}
						type="number"
						value={editWomenValue}
					/>
				</div>

				<div className="fr-input-group fr-mb-3w">
					<label className="fr-label" htmlFor="edit-men-variable-pay">
						Rémunération Hommes
					</label>
					<input
						className="fr-input"
						id="edit-men-variable-pay"
						min="0"
						onChange={handlePositiveChange(setEditMenValue)}
						type="number"
						value={editMenValue}
					/>
				</div>

				<div className="fr-mb-3w">
					<label className="fr-label" htmlFor="edit-variable-gap">
						Écart
					</label>
					<p
						className="fr-mb-0 fr-mt-1w"
						id="edit-variable-gap"
						style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}
					>
						<span className="fr-text--bold">{formatGap(editGap)}</span>
						{editGap !== null && (
							<span
								className={`fr-badge fr-badge--sm fr-badge--no-icon ${gapLevel(editGap) === "faible" ? "fr-badge--info" : "fr-badge--warning"}`}
							>
								{gapLevel(editGap)}
							</span>
						)}
					</p>
				</div>

				<ul className="fr-btns-group fr-btns-group--inline fr-btns-group--right fr-mt-4w">
					<li>
						<button
							className="fr-btn fr-btn--secondary"
							onClick={closePayDialog}
							type="button"
						>
							Annuler
						</button>
					</li>
					<li>
						<button
							className="fr-btn"
							onClick={handleSavePayEdit}
							type="button"
						>
							Enregistrer
						</button>
					</li>
				</ul>
			</dialog>

			{/* Beneficiary edit modal */}
			<dialog
				aria-labelledby="edit-beneficiary-title"
				className="fr-p-4w"
				ref={benefDialogRef}
				style={{
					maxWidth: "36rem",
					borderRadius: "0.25rem",
					border: "none",
					boxShadow: "0 6px 18px 0 rgba(0, 0, 18, 0.16)",
				}}
			>
				<div className="fr-grid-row fr-grid-row--right fr-mb-2w">
					<button
						aria-label="Fermer"
						className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-icon-close-line"
						onClick={closeBenefDialog}
						type="button"
					/>
				</div>

				<h2 className="fr-h4" id="edit-beneficiary-title">
					Modifier les bénéficiaires
				</h2>

				<p
					className="fr-text--sm fr-mb-3w"
					style={{ color: "var(--text-mention-grey)" }}
				>
					Tous les champs sont obligatoires
				</p>

				<div className="fr-input-group fr-mb-3w">
					<label className="fr-label" htmlFor="edit-benef-women">
						Nombre de bénéficiaires Femmes
					</label>
					<input
						className="fr-input"
						id="edit-benef-women"
						max={maxWomen}
						min="0"
						onChange={handleIntegerChange(setEditBenefWomen, maxWomen)}
						type="number"
						value={editBenefWomen}
					/>
				</div>

				<div className="fr-input-group fr-mb-3w">
					<label className="fr-label" htmlFor="edit-benef-men">
						Nombre de bénéficiaires Hommes
					</label>
					<input
						className="fr-input"
						id="edit-benef-men"
						max={maxMen}
						min="0"
						onChange={handleIntegerChange(setEditBenefMen, maxMen)}
						type="number"
						value={editBenefMen}
					/>
				</div>

				{benefValidationError && (
					<div
						aria-live="polite"
						className="fr-alert fr-alert--error fr-alert--sm fr-mb-3w"
					>
						<p>{benefValidationError}</p>
					</div>
				)}

				<ul className="fr-btns-group fr-btns-group--inline fr-btns-group--right fr-mt-4w">
					<li>
						<button
							className="fr-btn fr-btn--secondary"
							onClick={closeBenefDialog}
							type="button"
						>
							Annuler
						</button>
					</li>
					<li>
						<button
							className="fr-btn"
							onClick={handleSaveBenefEdit}
							type="button"
						>
							Enregistrer
						</button>
					</li>
				</ul>
			</dialog>
		</form>
	);
}
