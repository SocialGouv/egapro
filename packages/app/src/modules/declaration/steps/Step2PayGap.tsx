"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import { api } from "~/trpc/react";
import type { PayGapRow } from "../types";
import { DefinitionAccordion } from "../shared/DefinitionAccordion";
import { FormActions } from "../shared/FormActions";
import { SavedIndicator } from "../shared/SavedIndicator";
import { StepIndicator } from "../shared/StepIndicator";
import { TooltipButton } from "../shared/TooltipButton";

interface Step2PayGapProps {
	initialRows?: PayGapRow[];
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

export function Step2PayGap({ initialRows }: Step2PayGapProps) {
	const router = useRouter();
	const dialogRef = useRef<HTMLDialogElement>(null);

	const [rows, setRows] = useState<PayGapRow[]>(
		initialRows?.length ? initialRows : DEFAULT_ROWS,
	);

	const [editIndex, setEditIndex] = useState<number | null>(null);
	const [editWomenValue, setEditWomenValue] = useState("");
	const [editMenValue, setEditMenValue] = useState("");
	const hasInitialData =
		initialRows?.some((r) => r.womenValue || r.menValue) ?? false;
	const [saved, setSaved] = useState(hasInitialData);
	const [validationError, setValidationError] = useState<string | null>(null);

	const currentYear = new Date().getFullYear();

	const mutation = api.declaration.updateStepCategories.useMutation({
		onSuccess: () => router.push("/declaration-remuneration/etape/3"),
	});

	function handlePositiveChange(setter: (v: string) => void) {
		return (e: React.ChangeEvent<HTMLInputElement>) => {
			const val = e.target.value;
			if (val === "" || Number.parseFloat(val) >= 0) {
				setter(val);
			}
		};
	}

	function openEditModal(index: number) {
		setEditIndex(index);
		setEditWomenValue(rows[index]?.womenValue ?? "");
		setEditMenValue(rows[index]?.menValue ?? "");
		dialogRef.current?.showModal();
	}

	const closeDialog = useCallback(() => {
		dialogRef.current?.close();
	}, []);

	function handleSaveEdit() {
		if (editIndex === null) return;
		setRows((prev) =>
			prev.map((row, i) =>
				i === editIndex
					? { ...row, womenValue: editWomenValue, menValue: editMenValue }
					: row,
			),
		);
		setSaved(false);
		closeDialog();
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

	const editGap =
		editWomenValue && editMenValue
			? computeGap(editWomenValue, editMenValue)
			: null;

	// Compute interpretation text from actual data
	const annualRow = rows[0];
	const medianRow = rows[2];
	const hourlyRow = rows[1];
	const annualGap = annualRow
		? computeGap(annualRow.womenValue, annualRow.menValue)
		: null;
	const medianGap = medianRow
		? computeGap(medianRow.womenValue, medianRow.menValue)
		: null;
	const hourlyGap = hourlyRow
		? computeGap(hourlyRow.womenValue, hourlyRow.menValue)
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

			<StepIndicator currentStep={2} />

			{/* Description */}
			<p className="fr-mb-2w">
				Ces indicateurs mesurent la différence de rémunération, moyenne et
				médiane, entre les femmes et les hommes, exprimée en pourcentage du
				salaire masculin correspondant. Ils couvrent l&apos;ensemble de la
				rémunération : la partie fixe ainsi que les composantes variables ou
				complémentaires.
			</p>

			<p className="fr-mb-3w" style={{ fontWeight: 500 }}>
				Vérifiez les informations préremplies et modifiez-les si elles sont
				incorrectes avant de valider vos indicateurs.
				<TooltipButton
					id="tooltip-step2-info"
					label="Information sur les indicateurs"
				/>
			</p>

			{/* Read-only data table */}
			<div className="fr-table fr-table--no-caption fr-mb-1w">
				<div className="fr-table__wrapper">
					<div className="fr-table__container">
						<div className="fr-table__content">
							<table>
								<caption>Écart de rémunération</caption>
								<thead>
									<tr>
										<th scope="col">
											<strong>Rémunération</strong>
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
												<td>{row.womenValue || "-"}</td>
												<td>{row.menValue || "-"}</td>
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
														onClick={() => openEditModal(i)}
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
					id="tooltip-source-step2"
					label="Information sur la source"
				/>
			</p>

			<DefinitionAccordion id="accordion-step2" />

			{/* Interpretation callout */}
			<div className="fr-callout fr-callout--orange-terre-battue fr-mt-3w fr-mb-3w">
				<p className="fr-callout__text">
					<strong>Écart en défaveur des femmes :</strong> Les femmes perçoivent
					en moyenne une rémunération annuelle brute inférieure de{" "}
					{formatGap(annualGap)} à celle des hommes, et une rémunération médiane
					inférieure de {formatGap(medianGap)}. Les écarts horaires sont plus
					élevés, autour de {formatGap(hourlyGap)}.
				</p>
				<p className="fr-callout__text">
					<strong>Interprétation des résultats :</strong> L&apos;écart horaire
					est plus important que l&apos;écart annuel, ce qui peut
					s&apos;expliquer par des différences dans le volume d&apos;heures
					travaillées.
				</p>
			</div>

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

			{/* Edit modal */}
			<dialog
				aria-labelledby="edit-pay-gap-title"
				className="fr-p-4w"
				ref={dialogRef}
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
						onClick={closeDialog}
						type="button"
					/>
				</div>

				<h2 className="fr-h4" id="edit-pay-gap-title">
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
					<label className="fr-label" htmlFor="edit-women-pay">
						Rémunération Femmes
					</label>
					<input
						className="fr-input"
						id="edit-women-pay"
						min="0"
						onChange={handlePositiveChange(setEditWomenValue)}
						type="number"
						value={editWomenValue}
					/>
				</div>

				<div className="fr-input-group fr-mb-3w">
					<label className="fr-label" htmlFor="edit-men-pay">
						Rémunération Hommes
					</label>
					<input
						className="fr-input"
						id="edit-men-pay"
						min="0"
						onChange={handlePositiveChange(setEditMenValue)}
						type="number"
						value={editMenValue}
					/>
				</div>

				<div className="fr-mb-3w">
					<label className="fr-label" htmlFor="edit-gap">
						Écart
					</label>
					<p
						className="fr-mb-0 fr-mt-1w"
						id="edit-gap"
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
							onClick={closeDialog}
							type="button"
						>
							Annuler
						</button>
					</li>
					<li>
						<button className="fr-btn" onClick={handleSaveEdit} type="button">
							Enregistrer
						</button>
					</li>
				</ul>
			</dialog>
		</form>
	);
}
