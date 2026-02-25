"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import { api } from "~/trpc/react";
import { DefinitionAccordion } from "../shared/DefinitionAccordion";
import { FormActions } from "../shared/FormActions";
import { SavedIndicator } from "../shared/SavedIndicator";
import { StepIndicator } from "../shared/StepIndicator";
import { TooltipButton } from "../shared/TooltipButton";
import type { StepCategoryData } from "../types";

const QUARTILE_NAMES = [
	"1er quartile",
	"2e quartile",
	"3e quartile",
	"4e quartile",
] as const;

interface Step4QuartileDistributionProps {
	initialAnnualCategories?: StepCategoryData[];
	initialHourlyCategories?: StepCategoryData[];
	maxWomen?: number;
	maxMen?: number;
}

type EditMode = {
	field: "remuneration" | "womenCount" | "menCount";
	tableType: "annual" | "hourly";
} | null;

function formatCurrency(value?: string): string {
	if (!value) return "-";
	const n = Number.parseFloat(value);
	if (Number.isNaN(n)) return "-";
	return `${n.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
}

function computePercentage(count: number, total: number): string {
	if (total === 0) return "-";
	return `${((count / total) * 100).toFixed(1).replace(".", ",")} %`;
}

export function Step4QuartileDistribution({
	initialAnnualCategories,
	initialHourlyCategories,
	maxWomen,
	maxMen,
}: Step4QuartileDistributionProps) {
	const router = useRouter();
	const dialogRef = useRef<HTMLDialogElement>(null);

	const defaultCategories = () =>
		QUARTILE_NAMES.map((name) => ({ name })) as StepCategoryData[];

	const [annualCategories, setAnnualCategories] = useState<StepCategoryData[]>(
		initialAnnualCategories?.length
			? initialAnnualCategories
			: defaultCategories(),
	);

	const [hourlyCategories, setHourlyCategories] = useState<StepCategoryData[]>(
		initialHourlyCategories?.length
			? initialHourlyCategories
			: defaultCategories(),
	);

	const [editMode, setEditMode] = useState<EditMode>(null);
	const [editValues, setEditValues] = useState<string[]>(["", "", "", ""]);
	const [validationError, setValidationError] = useState<string | null>(null);

	const hasInitialData = [
		...(initialAnnualCategories ?? []),
		...(initialHourlyCategories ?? []),
	].some(
		(c) =>
			c.womenCount !== undefined ||
			c.menCount !== undefined ||
			c.womenValue !== undefined ||
			c.menValue !== undefined,
	);
	const [saved, setSaved] = useState(hasInitialData);

	const currentYear = new Date().getFullYear();

	const mutation = api.declaration.updateStepCategories.useMutation({
		onSuccess: () => router.push("/declaration/etape/5"),
	});

	function getCategories(tableType: "annual" | "hourly") {
		return tableType === "annual" ? annualCategories : hourlyCategories;
	}

	function openEditModal(
		field: "remuneration" | "womenCount" | "menCount",
		tableType: "annual" | "hourly",
	) {
		setEditMode({ field, tableType });
		setValidationError(null);
		const cats = getCategories(tableType);
		const values = cats.map((c) => {
			if (field === "remuneration") return c.womenValue ?? "";
			if (field === "womenCount") return c.womenCount?.toString() ?? "";
			return c.menCount?.toString() ?? "";
		});
		setEditValues(values);
		dialogRef.current?.showModal();
	}

	const closeDialog = useCallback(() => {
		dialogRef.current?.close();
		setEditMode(null);
	}, []);

	function handleValueChange(index: number) {
		return (e: React.ChangeEvent<HTMLInputElement>) => {
			const val = e.target.value;
			if (!editMode) return;

			if (editMode.field === "remuneration") {
				if (val === "" || Number.parseFloat(val) >= 0) {
					setEditValues((prev) => prev.map((v, i) => (i === index ? val : v)));
				}
			} else {
				if (val === "") {
					setEditValues((prev) => prev.map((v, i) => (i === index ? val : v)));
					setValidationError(null);
					return;
				}
				const n = Number.parseInt(val, 10);
				if (Number.isNaN(n) || n < 0) return;
				const max = editMode.field === "womenCount" ? maxWomen : maxMen;
				if (max !== undefined && n > max) {
					setValidationError(
						`Le nombre ne peut pas dépasser l'effectif de l'étape 1 (${max}).`,
					);
					return;
				}
				setValidationError(null);
				setEditValues((prev) => prev.map((v, i) => (i === index ? val : v)));
			}
		};
	}

	function handleSaveEdit() {
		if (!editMode) return;
		const setter =
			editMode.tableType === "annual"
				? setAnnualCategories
				: setHourlyCategories;
		setter((prev) =>
			prev.map((c, i) => {
				if (editMode.field === "remuneration") {
					return { ...c, womenValue: editValues[i] || undefined };
				}
				if (editMode.field === "womenCount") {
					return {
						...c,
						womenCount: editValues[i]
							? Number.parseInt(editValues[i]!, 10)
							: undefined,
					};
				}
				return {
					...c,
					menCount: editValues[i]
						? Number.parseInt(editValues[i]!, 10)
						: undefined,
				};
			}),
		);
		setSaved(false);
		closeDialog();
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		mutation.mutate({
			step: 4,
			categories: [
				...annualCategories.map((c) => ({
					name: `annual:${c.name}`,
					womenCount: c.womenCount,
					menCount: c.menCount,
					womenValue: c.womenValue,
				})),
				...hourlyCategories.map((c) => ({
					name: `hourly:${c.name}`,
					womenCount: c.womenCount,
					menCount: c.menCount,
					womenValue: c.womenValue,
				})),
			],
		});
	}

	// 4th quartile percentage for interpretation callout (annual)
	const q4 = annualCategories[3];
	const q4Total = (q4?.womenCount ?? 0) + (q4?.menCount ?? 0);
	const q4WomenPct =
		q4Total > 0 ? ((q4?.womenCount ?? 0) / q4Total) * 100 : null;

	// Computed total for count dialogs
	const editTotal =
		editMode?.field !== "remuneration"
			? editValues.reduce(
					(sum, v) => sum + (v ? Number.parseInt(v, 10) || 0 : 0),
					0,
				)
			: 0;

	// Dialog labels
	const dialogTitle =
		editMode?.field === "remuneration"
			? "Modifier les données"
			: "Modifier les effectifs";
	const dialogSubtitle = editMode
		? editMode.field === "remuneration"
			? editMode.tableType === "annual"
				? "Rémunération annuelle brute moyenne"
				: "Rémunération horaire brute moyenne"
			: editMode.field === "womenCount"
				? "Nombre de femmes"
				: "Nombre d'hommes"
		: "";

	function renderQuartileTable(title: string, tableType: "annual" | "hourly") {
		const cats = getCategories(tableType);
		const totalWomen = cats.reduce((sum, c) => sum + (c.womenCount ?? 0), 0);
		const totalMen = cats.reduce((sum, c) => sum + (c.menCount ?? 0), 0);
		const totalAll = totalWomen + totalMen;

		return (
			<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
				<h3 className="fr-h5 fr-mb-0">{title}</h3>
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "0.5rem",
					}}
				>
					<div className="fr-table fr-table--no-caption fr-mb-0">
						<div className="fr-table__wrapper">
							<div className="fr-table__container">
								<div className="fr-table__content">
									<table>
										<caption>{title}</caption>
										<thead>
											<tr>
												<th scope="col">{/* row label */}</th>
												{QUARTILE_NAMES.map((name) => (
													<th key={name} scope="col">
														{name}
													</th>
												))}
												<th scope="col">Tous les salariés</th>
												<th scope="col">{/* actions */}</th>
											</tr>
										</thead>
										<tbody>
											{/* Row 1: Remuneration */}
											<tr>
												<td>
													<strong>Rémunération brute</strong>
												</td>
												{cats.map((c) => (
													<td key={c.name}>{formatCurrency(c.womenValue)}</td>
												))}
												<td>-</td>
												<td>
													<button
														aria-label={`Modifier la rémunération ${tableType === "annual" ? "annuelle" : "horaire"}`}
														className="fr-btn fr-btn--tertiary-no-outline fr-icon-edit-line fr-btn--sm"
														onClick={() =>
															openEditModal("remuneration", tableType)
														}
														type="button"
													/>
												</td>
											</tr>
											{/* Row 2: Nombre de femmes */}
											<tr>
												<td>
													<strong>Nombre de femmes</strong>
												</td>
												{cats.map((c) => (
													<td key={c.name}>{c.womenCount ?? "-"}</td>
												))}
												<td>{totalWomen || "-"}</td>
												<td>
													<button
														aria-label={`Modifier le nombre de femmes (${tableType === "annual" ? "annuel" : "horaire"})`}
														className="fr-btn fr-btn--tertiary-no-outline fr-icon-edit-line fr-btn--sm"
														onClick={() =>
															openEditModal("womenCount", tableType)
														}
														type="button"
													/>
												</td>
											</tr>
											{/* Row 3: Pourcentage de femmes */}
											<tr>
												<td>
													<strong>Pourcentage de femmes</strong>
												</td>
												{cats.map((c) => {
													const total = (c.womenCount ?? 0) + (c.menCount ?? 0);
													return (
														<td key={c.name}>
															{computePercentage(c.womenCount ?? 0, total)}
														</td>
													);
												})}
												<td>{computePercentage(totalWomen, totalAll)}</td>
												<td>{/* no action for computed row */}</td>
											</tr>
											{/* Row 4: Nombre d'hommes */}
											<tr>
												<td>
													<strong>Nombre d&apos;hommes</strong>
												</td>
												{cats.map((c) => (
													<td key={c.name}>{c.menCount ?? "-"}</td>
												))}
												<td>{totalMen || "-"}</td>
												<td>
													<button
														aria-label={`Modifier le nombre d'hommes (${tableType === "annual" ? "annuel" : "horaire"})`}
														className="fr-btn fr-btn--tertiary-no-outline fr-icon-edit-line fr-btn--sm"
														onClick={() => openEditModal("menCount", tableType)}
														type="button"
													/>
												</td>
											</tr>
											{/* Row 5: Pourcentage d'hommes */}
											<tr>
												<td>
													<strong>Pourcentage d&apos;hommes</strong>
												</td>
												{cats.map((c) => {
													const total = (c.womenCount ?? 0) + (c.menCount ?? 0);
													return (
														<td key={c.name}>
															{computePercentage(c.menCount ?? 0, total)}
														</td>
													);
												})}
												<td>{computePercentage(totalMen, totalAll)}</td>
												<td>{/* no action for computed row */}</td>
											</tr>
										</tbody>
									</table>
								</div>
							</div>
						</div>
					</div>

					{/* Source text */}
					<p
						className="fr-text--sm fr-mb-0"
						style={{ color: "var(--text-mention-grey)" }}
					>
						Source : déclarations sociales nominatives mise à jour le
						27/01/2026.
						<TooltipButton
							id={`tooltip-source-step4-${tableType}`}
							label="Information sur la source"
						/>
					</p>
				</div>
			</div>
		);
	}

	return (
		<form
			onSubmit={handleSubmit}
			style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
		>
			{/* Title + save status */}
			<div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters">
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

			<StepIndicator currentStep={4} />

			{/* Description + instructions */}
			<div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
				<p className="fr-mb-0">
					Cet indicateur répartit l&apos;ensemble des salariés en quatre groupes
					de rémunération appelés quartiles : du quartile inférieur qui regroupe
					les salariés les moins rémunérés, au quartile supérieur qui rassemble
					les salariés les mieux rémunérés.
				</p>

				<p className="fr-mb-0" style={{ fontWeight: 500 }}>
					Vérifiez les informations préremplies et modifiez-les si elles sont
					incorrectes avant de valider vos indicateurs.
					<TooltipButton
						id="tooltip-step4-info"
						label="Information sur les indicateurs"
					/>
				</p>
			</div>

			{/* Table 1 - Annual remuneration */}
			{renderQuartileTable("Rémunération annuelle brute moyenne", "annual")}

			{/* Table 2 - Hourly remuneration */}
			{renderQuartileTable("Rémunération horaire brute moyenne", "hourly")}

			<DefinitionAccordion id="accordion-step4" />

			{/* Interpretation callout */}
			<div className="fr-callout fr-callout--orange-terre-battue">
				<p className="fr-callout__text">
					<strong>Écart en défaveur des femmes :</strong> les femmes sont
					nettement moins présentes dans le quartile des plus hauts salaires
					{q4WomenPct !== null && (
						<> ({q4WomenPct.toFixed(1).replace(".", ",")} %)</>
					)}
					, alors qu&apos;elles sont proches de la parité dans les autres
					quartiles.
				</p>
				<p className="fr-callout__text">
					<strong>Interprétation des résultats :</strong> les femmes accèdent
					moins aux postes ou situations les mieux rémunérés, ce qui indique une
					inégalité d&apos;accès aux niveaux de salaire les plus élevés.
				</p>
			</div>

			{mutation.error && (
				<div aria-live="polite" className="fr-alert fr-alert--error">
					<p>{mutation.error.message}</p>
				</div>
			)}

			<FormActions
				isSubmitting={mutation.isPending}
				previousHref="/declaration/etape/3"
			/>

			{/* Edit dialog */}
			<dialog
				aria-labelledby="edit-quartile-title"
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

				<h2 className="fr-h4" id="edit-quartile-title">
					{dialogTitle}
				</h2>

				<p className="fr-text--bold fr-mb-1v">{dialogSubtitle}</p>
				<p
					className="fr-text--sm fr-mb-3w"
					style={{ color: "var(--text-mention-grey)" }}
				>
					Tous les champs sont obligatoires
				</p>

				{QUARTILE_NAMES.map((name, i) => (
					<div className="fr-input-group fr-mb-3w" key={name}>
						<label className="fr-label" htmlFor={`edit-q${i}`}>
							{name}
							{editMode?.field === "remuneration" && (
								<span className="fr-hint-text">Montant en euros</span>
							)}
						</label>
						<input
							className="fr-input"
							id={`edit-q${i}`}
							min="0"
							onChange={handleValueChange(i)}
							step={editMode?.field === "remuneration" ? "any" : "1"}
							type="number"
							value={editValues[i] ?? ""}
						/>
					</div>
				))}

				{/* Computed total for count dialogs */}
				{editMode?.field !== "remuneration" && (
					<div className="fr-input-group fr-mb-3w">
						<p className="fr-label" id="edit-total-label">
							Total
						</p>
						<p className="fr-text--bold" aria-labelledby="edit-total-label">
							{editTotal}
						</p>
					</div>
				)}

				{validationError && (
					<div
						aria-live="polite"
						className="fr-alert fr-alert--error fr-alert--sm fr-mb-3w"
					>
						<p>{validationError}</p>
					</div>
				)}

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
