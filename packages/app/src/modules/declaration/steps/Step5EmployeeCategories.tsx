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

// -- Local types --

let nextCategoryId = 0;

interface EmployeeCategory {
	id: number;
	name: string;
	detail: string;
	womenCount: string;
	menCount: string;
	annualBaseWomen: string;
	annualBaseMen: string;
	annualVariableWomen: string;
	annualVariableMen: string;
	hourlyBaseWomen: string;
	hourlyBaseMen: string;
	hourlyVariableWomen: string;
	hourlyVariableMen: string;
}

// -- Helpers --

function createEmptyCategory(): EmployeeCategory {
	return {
		id: nextCategoryId++,
		name: "",
		detail: "",
		womenCount: "",
		menCount: "",
		annualBaseWomen: "",
		annualBaseMen: "",
		annualVariableWomen: "",
		annualVariableMen: "",
		hourlyBaseWomen: "",
		hourlyBaseMen: "",
		hourlyVariableWomen: "",
		hourlyVariableMen: "",
	};
}

function serializeCategories(
	categories: EmployeeCategory[],
	source: string,
): Array<{
	name: string;
	womenCount?: number;
	menCount?: number;
	womenValue?: string;
	menValue?: string;
}> {
	const result: Array<{
		name: string;
		womenCount?: number;
		menCount?: number;
		womenValue?: string;
		menValue?: string;
	}> = [];

	// Store source in categoryName (not in numeric womenValue column)
	result.push({ name: `meta:source:${source}` });

	for (let i = 0; i < categories.length; i++) {
		const cat = categories[i]!;
		const p = `cat:${i}`;

		// Store text data (name/detail) in categoryName, not in numeric columns
		result.push({ name: `${p}:name:${cat.name}` });
		result.push({ name: `${p}:detail:${cat.detail}` });
		result.push({
			name: `${p}:effectif`,
			womenCount: cat.womenCount
				? Number.parseInt(cat.womenCount, 10)
				: undefined,
			menCount: cat.menCount ? Number.parseInt(cat.menCount, 10) : undefined,
		});
		result.push({
			name: `${p}:annual:base`,
			womenValue: cat.annualBaseWomen || undefined,
			menValue: cat.annualBaseMen || undefined,
		});
		result.push({
			name: `${p}:annual:variable`,
			womenValue: cat.annualVariableWomen || undefined,
			menValue: cat.annualVariableMen || undefined,
		});
		result.push({
			name: `${p}:hourly:base`,
			womenValue: cat.hourlyBaseWomen || undefined,
			menValue: cat.hourlyBaseMen || undefined,
		});
		result.push({
			name: `${p}:hourly:variable`,
			womenValue: cat.hourlyVariableWomen || undefined,
			menValue: cat.hourlyVariableMen || undefined,
		});
	}

	return result;
}

function deserializeCategories(data: StepCategoryData[]): {
	categories: EmployeeCategory[];
	source: string;
} {
	const sourceRow = data.find((d) => d.name.startsWith("meta:source:"));
	const source = sourceRow ? sourceRow.name.replace("meta:source:", "") : "";

	const catMap = new Map<number, EmployeeCategory>();

	for (const row of data) {
		// Parse text fields encoded in categoryName
		const nameMatch = row.name.match(/^cat:(\d+):name:(.*)$/);
		if (nameMatch) {
			const index = Number.parseInt(nameMatch[1]!, 10);
			if (!catMap.has(index)) catMap.set(index, createEmptyCategory());
			catMap.get(index)!.name = nameMatch[2]!;
			continue;
		}

		const detailMatch = row.name.match(/^cat:(\d+):detail:(.*)$/);
		if (detailMatch) {
			const index = Number.parseInt(detailMatch[1]!, 10);
			if (!catMap.has(index)) catMap.set(index, createEmptyCategory());
			catMap.get(index)!.detail = detailMatch[2]!;
			continue;
		}

		// Parse numeric fields
		const match = row.name.match(/^cat:(\d+):(.+)$/);
		if (!match) continue;

		const index = Number.parseInt(match[1]!, 10);
		const field = match[2]!;

		if (!catMap.has(index)) {
			catMap.set(index, createEmptyCategory());
		}
		const cat = catMap.get(index)!;

		switch (field) {
			case "effectif":
				cat.womenCount = row.womenCount?.toString() ?? "";
				cat.menCount = row.menCount?.toString() ?? "";
				break;
			case "annual:base":
				cat.annualBaseWomen = row.womenValue ?? "";
				cat.annualBaseMen = row.menValue ?? "";
				break;
			case "annual:variable":
				cat.annualVariableWomen = row.womenValue ?? "";
				cat.annualVariableMen = row.menValue ?? "";
				break;
			case "hourly:base":
				cat.hourlyBaseWomen = row.womenValue ?? "";
				cat.hourlyBaseMen = row.menValue ?? "";
				break;
			case "hourly:variable":
				cat.hourlyVariableWomen = row.womenValue ?? "";
				cat.hourlyVariableMen = row.menValue ?? "";
				break;
		}
	}

	const categories = Array.from(catMap.entries())
		.sort(([a], [b]) => a - b)
		.map(([, cat]) => cat);

	return { categories, source };
}

function computeGap(womenVal: string, menVal: string): number | null {
	const w = Number.parseFloat(womenVal);
	const m = Number.parseFloat(menVal);
	if (Number.isNaN(w) || Number.isNaN(m) || m === 0) return null;
	return Math.abs(((m - w) / m) * 100);
}

function formatGap(gap: number | null): string {
	if (gap === null) return "-";
	return gap.toFixed(1).replace(".", ",");
}

function formatTotal(value: number | null, unit: string): string {
	if (value === null) return "-";
	return `${value.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${unit}`;
}

function computeTotal(base: string, variable: string): number | null {
	const b = Number.parseFloat(base);
	const v = Number.parseFloat(variable);
	if (Number.isNaN(b) && Number.isNaN(v)) return null;
	return (Number.isNaN(b) ? 0 : b) + (Number.isNaN(v) ? 0 : v);
}

// -- Styles --

const sectionHeaderStyle: React.CSSProperties = {
	backgroundColor: "var(--background-default-grey-hover)",
};

const inputCellStyle: React.CSSProperties = {
	display: "flex",
	alignItems: "center",
	gap: "0.375rem",
};

const compactInputStyle: React.CSSProperties = {
	width: "100px",
};

// -- Component --

interface Step5EmployeeCategoriesProps {
	initialCategories?: StepCategoryData[];
	maxWomen?: number;
	maxMen?: number;
}

export function Step5EmployeeCategories({
	initialCategories,
	maxWomen,
	maxMen,
}: Step5EmployeeCategoriesProps) {
	const router = useRouter();
	const currentYear = new Date().getFullYear();
	const referenceYear = currentYear - 1;

	const initial =
		initialCategories?.length && initialCategories.length > 0
			? deserializeCategories(initialCategories)
			: {
					categories: [createEmptyCategory()],
					source: "",
				};

	const [categories, setCategories] = useState<EmployeeCategory[]>(
		initial.categories,
	);
	const [source, setSource] = useState(initial.source);

	const hasInitialData = initialCategories?.some(
		(c) =>
			c.name.startsWith("cat:") &&
			!c.name.match(/^cat:\d+:(name|detail):/) &&
			(c.womenCount !== undefined || c.womenValue !== undefined),
	);
	const [saved, setSaved] = useState(!!hasInitialData);

	const [workforceError, setWorkforceError] = useState("");
	const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
	const deleteDialogRef = useRef<HTMLDialogElement>(null);

	const closeDeleteDialog = useCallback(() => {
		deleteDialogRef.current?.close();
		setDeleteIndex(null);
	}, []);

	const mutation = api.declaration.updateStepCategories.useMutation({
		onSuccess: () => router.push("/declaration/etape/6"),
	});

	function updateCategory(
		index: number,
		field: keyof EmployeeCategory,
		value: string,
	) {
		setCategories((prev) =>
			prev.map((cat, i) => (i === index ? { ...cat, [field]: value } : cat)),
		);
		setSaved(false);
	}

	function handlePositiveNumberChange(
		index: number,
		field: keyof EmployeeCategory,
		isInteger: boolean,
	) {
		return (e: React.ChangeEvent<HTMLInputElement>) => {
			const val = e.target.value;
			if (val === "") {
				updateCategory(index, field, val);
				return;
			}
			const n = isInteger ? Number.parseInt(val, 10) : Number.parseFloat(val);
			if (Number.isNaN(n) || n < 0) return;
			updateCategory(index, field, val);
		};
	}

	function addCategory() {
		setCategories((prev) => [...prev, createEmptyCategory()]);
		setSaved(false);
	}

	function askRemoveCategory(index: number) {
		setDeleteIndex(index);
		deleteDialogRef.current?.showModal();
	}

	function confirmRemoveCategory() {
		if (deleteIndex !== null) {
			setCategories((prev) => prev.filter((_, i) => i !== deleteIndex));
			setSaved(false);
		}
		closeDeleteDialog();
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setWorkforceError("");

		// Validate required and unique category names
		const emptyNames = categories.some((cat) => !cat.name.trim());
		if (emptyNames) {
			setWorkforceError(
				"Le nom de chaque catégorie d'emplois est obligatoire.",
			);
			return;
		}

		const names = categories.map((cat) => cat.name.trim().toLowerCase());
		const hasDuplicates = names.length !== new Set(names).size;
		if (hasDuplicates) {
			setWorkforceError(
				"Les noms des catégories d'emplois doivent être uniques.",
			);
			return;
		}

		// Validate workforce totals against step 1
		if (maxWomen !== undefined || maxMen !== undefined) {
			const totalWomen = categories.reduce(
				(sum, cat) =>
					sum + (cat.womenCount ? Number.parseInt(cat.womenCount, 10) : 0),
				0,
			);
			const totalMen = categories.reduce(
				(sum, cat) =>
					sum + (cat.menCount ? Number.parseInt(cat.menCount, 10) : 0),
				0,
			);

			const errors: string[] = [];
			if (maxWomen !== undefined && totalWomen !== maxWomen) {
				errors.push(
					`Le total des effectifs femmes (${totalWomen}) ne correspond pas à l'effectif déclaré à l'étape 1 (${maxWomen}).`,
				);
			}
			if (maxMen !== undefined && totalMen !== maxMen) {
				errors.push(
					`Le total des effectifs hommes (${totalMen}) ne correspond pas à l'effectif déclaré à l'étape 1 (${maxMen}).`,
				);
			}
			if (errors.length > 0) {
				setWorkforceError(errors.join(" "));
				return;
			}
		}

		mutation.mutate({
			step: 5,
			categories: serializeCategories(categories, source),
		});
	}

	function renderCategoryTable(cat: EmployeeCategory, catIndex: number) {
		const annualTotalWomen = computeTotal(
			cat.annualBaseWomen,
			cat.annualVariableWomen,
		);
		const annualTotalMen = computeTotal(
			cat.annualBaseMen,
			cat.annualVariableMen,
		);
		const hourlyTotalWomen = computeTotal(
			cat.hourlyBaseWomen,
			cat.hourlyVariableWomen,
		);
		const hourlyTotalMen = computeTotal(
			cat.hourlyBaseMen,
			cat.hourlyVariableMen,
		);

		const annualTotalGap =
			annualTotalWomen !== null && annualTotalMen !== null
				? computeGap(annualTotalWomen.toString(), annualTotalMen.toString())
				: null;

		const hourlyTotalGap =
			hourlyTotalWomen !== null && hourlyTotalMen !== null
				? computeGap(hourlyTotalWomen.toString(), hourlyTotalMen.toString())
				: null;

		const id = (suffix: string) => `cat-${catIndex}-${suffix}`;
		const pos = handlePositiveNumberChange;

		return (
			<div className="fr-table fr-table--no-caption fr-mb-0">
				<div className="fr-table__wrapper">
					<div className="fr-table__container">
						<div className="fr-table__content">
							<table>
								<caption>Données catégorie {catIndex + 1}</caption>
								<thead>
									<tr>
										<th scope="col" style={{ width: "230px" }}>
											{/* row label */}
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
									</tr>
								</thead>
								<tbody>
									{/* Section: Nombre de salariés */}
									<tr>
										<td colSpan={4} style={sectionHeaderStyle}>
											<strong>Nombre de salariés [Nombre total]</strong>
										</td>
									</tr>
									<tr>
										<td>Effectif physique</td>
										<td>
											<div style={inputCellStyle}>
												<input
													aria-label={`Effectif femmes, catégorie ${catIndex + 1}`}
													className="fr-input"
													id={id("women-count")}
													min="0"
													onChange={pos(catIndex, "womenCount", true)}
													step="1"
													style={compactInputStyle}
													type="number"
													value={cat.womenCount}
												/>
												<span className="fr-text--sm">nb</span>
											</div>
										</td>
										<td>
											<div style={inputCellStyle}>
												<input
													aria-label={`Effectif hommes, catégorie ${catIndex + 1}`}
													className="fr-input"
													id={id("men-count")}
													min="0"
													onChange={pos(catIndex, "menCount", true)}
													step="1"
													style={compactInputStyle}
													type="number"
													value={cat.menCount}
												/>
												<span className="fr-text--sm">nb</span>
											</div>
										</td>
										<td>
											{formatGap(computeGap(cat.womenCount, cat.menCount))} %
										</td>
									</tr>

									{/* Section: Rémunération annuelle brute */}
									<tr>
										<td colSpan={4} style={sectionHeaderStyle}>
											<strong>Rémunération annuelle brute</strong>
										</td>
									</tr>
									<tr>
										<td>Salaire de base</td>
										<td>
											<div style={inputCellStyle}>
												<input
													aria-label={`Salaire de base annuel femmes, catégorie ${catIndex + 1}`}
													className="fr-input"
													id={id("annual-base-women")}
													min="0"
													onChange={pos(catIndex, "annualBaseWomen", false)}
													step="any"
													style={compactInputStyle}
													type="number"
													value={cat.annualBaseWomen}
												/>
												<span className="fr-text--sm">€</span>
											</div>
										</td>
										<td>
											<div style={inputCellStyle}>
												<input
													aria-label={`Salaire de base annuel hommes, catégorie ${catIndex + 1}`}
													className="fr-input"
													id={id("annual-base-men")}
													min="0"
													onChange={pos(catIndex, "annualBaseMen", false)}
													step="any"
													style={compactInputStyle}
													type="number"
													value={cat.annualBaseMen}
												/>
												<span className="fr-text--sm">€</span>
											</div>
										</td>
										<td>
											{formatGap(
												computeGap(cat.annualBaseWomen, cat.annualBaseMen),
											)}{" "}
											%
										</td>
									</tr>
									<tr>
										<td>
											Composantes variables
											<br />
											ou complémentaires
										</td>
										<td>
											<div style={inputCellStyle}>
												<input
													aria-label={`Composantes variables annuelles femmes, catégorie ${catIndex + 1}`}
													className="fr-input"
													id={id("annual-variable-women")}
													min="0"
													onChange={pos(catIndex, "annualVariableWomen", false)}
													step="any"
													style={compactInputStyle}
													type="number"
													value={cat.annualVariableWomen}
												/>
												<span className="fr-text--sm">€</span>
											</div>
										</td>
										<td>
											<div style={inputCellStyle}>
												<input
													aria-label={`Composantes variables annuelles hommes, catégorie ${catIndex + 1}`}
													className="fr-input"
													id={id("annual-variable-men")}
													min="0"
													onChange={pos(catIndex, "annualVariableMen", false)}
													step="any"
													style={compactInputStyle}
													type="number"
													value={cat.annualVariableMen}
												/>
												<span className="fr-text--sm">€</span>
											</div>
										</td>
										<td>
											{formatGap(
												computeGap(
													cat.annualVariableWomen,
													cat.annualVariableMen,
												),
											)}{" "}
											%
										</td>
									</tr>
									{/* Total annuel */}
									<tr>
										<td colSpan={4} style={sectionHeaderStyle}>
											<strong>Total</strong>
										</td>
									</tr>
									<tr>
										<td>{/* empty label */}</td>
										<td>{formatTotal(annualTotalWomen, "€")}</td>
										<td>{formatTotal(annualTotalMen, "€")}</td>
										<td>{formatGap(annualTotalGap)} %</td>
									</tr>

									{/* Section: Rémunération horaire brute */}
									<tr>
										<td colSpan={4} style={sectionHeaderStyle}>
											<strong>Rémunération horaire brute</strong>
										</td>
									</tr>
									<tr>
										<td>Salaire de base</td>
										<td>
											<div style={inputCellStyle}>
												<input
													aria-label={`Salaire de base horaire femmes, catégorie ${catIndex + 1}`}
													className="fr-input"
													id={id("hourly-base-women")}
													min="0"
													onChange={pos(catIndex, "hourlyBaseWomen", false)}
													step="any"
													style={compactInputStyle}
													type="number"
													value={cat.hourlyBaseWomen}
												/>
												<span className="fr-text--sm">€</span>
											</div>
										</td>
										<td>
											<div style={inputCellStyle}>
												<input
													aria-label={`Salaire de base horaire hommes, catégorie ${catIndex + 1}`}
													className="fr-input"
													id={id("hourly-base-men")}
													min="0"
													onChange={pos(catIndex, "hourlyBaseMen", false)}
													step="any"
													style={compactInputStyle}
													type="number"
													value={cat.hourlyBaseMen}
												/>
												<span className="fr-text--sm">€</span>
											</div>
										</td>
										<td>
											{formatGap(
												computeGap(cat.hourlyBaseWomen, cat.hourlyBaseMen),
											)}{" "}
											%
										</td>
									</tr>
									<tr>
										<td>
											Composantes variables
											<br />
											ou complémentaires
										</td>
										<td>
											<div style={inputCellStyle}>
												<input
													aria-label={`Composantes variables horaires femmes, catégorie ${catIndex + 1}`}
													className="fr-input"
													id={id("hourly-variable-women")}
													min="0"
													onChange={pos(catIndex, "hourlyVariableWomen", false)}
													step="any"
													style={compactInputStyle}
													type="number"
													value={cat.hourlyVariableWomen}
												/>
												<span className="fr-text--sm">€</span>
											</div>
										</td>
										<td>
											<div style={inputCellStyle}>
												<input
													aria-label={`Composantes variables horaires hommes, catégorie ${catIndex + 1}`}
													className="fr-input"
													id={id("hourly-variable-men")}
													min="0"
													onChange={pos(catIndex, "hourlyVariableMen", false)}
													step="any"
													style={compactInputStyle}
													type="number"
													value={cat.hourlyVariableMen}
												/>
												<span className="fr-text--sm">€</span>
											</div>
										</td>
										<td>
											{formatGap(
												computeGap(
													cat.hourlyVariableWomen,
													cat.hourlyVariableMen,
												),
											)}{" "}
											%
										</td>
									</tr>
									{/* Total horaire */}
									<tr>
										<td colSpan={4} style={sectionHeaderStyle}>
											<strong>Total</strong>
										</td>
									</tr>
									<tr>
										<td>{/* empty label */}</td>
										<td>{formatTotal(hourlyTotalWomen, "€")}</td>
										<td>{formatTotal(hourlyTotalMen, "€")}</td>
										<td>{formatGap(hourlyTotalGap)} %</td>
									</tr>
								</tbody>
							</table>
						</div>
					</div>
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

			<StepIndicator currentStep={5} />

			{/* Description + reference period + source dropdown */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: "1rem",
				}}
			>
				<p className="fr-mb-0">
					Cet indicateur permet de mesurer l&apos;écart de rémunération entre
					les femmes et les hommes au sein de chaque catégorie de salariés, en
					distinguant le salaire de base des composantes variables ou
					complémentaires.
				</p>

				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "1rem",
					}}
				>
					<p className="fr-mb-0">
						Période de référence pour le calcul des indicateurs : 01/01/
						{referenceYear} - 31/12/{referenceYear}.
					</p>
					<TooltipButton
						id="tooltip-step5-period"
						label="Information sur la période de référence"
					/>
				</div>

				{/* Source dropdown */}
				<div className="fr-select-group">
					<label className="fr-label" htmlFor="source-select">
						Quelle est la source utilisée pour déterminer les catégories
						d&apos;emplois ?
					</label>
					<select
						className="fr-select"
						id="source-select"
						onChange={(e) => {
							setSource(e.target.value);
							setSaved(false);
						}}
						value={source}
					>
						<option disabled value="">
							Sélectionner une option
						</option>
						<option value="convention-collective">Convention collective</option>
						<option value="accord-entreprise">Accord d&apos;entreprise</option>
						<option value="classification-interne">
							Classification interne
						</option>
						<option value="autre">Autre</option>
					</select>
				</div>
			</div>

			{/* Instruction text */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					gap: "0.5rem",
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "0.5rem",
					}}
				>
					<p
						className="fr-mb-0"
						style={{ fontSize: "1.125rem", fontWeight: 500 }}
					>
						Saisissez les données manquantes avant de valider votre indicateur.
					</p>
					<TooltipButton
						id="tooltip-step5-instruction"
						label="Information sur la saisie"
					/>
				</div>
				<p className="fr-mb-0">Tous les champs sont obligatoires.</p>
			</div>

			{/* Category blocks */}
			{categories.map((cat, index) => (
				<div
					key={cat.id}
					style={{
						display: "flex",
						flexDirection: "column",
						gap: "1rem",
					}}
				>
					{/* Category header */}
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							gap: "0.5rem",
						}}
					>
						<p className="fr-text--bold fr-mb-0">
							Catégorie d&apos;emplois n°{index + 1}
						</p>
						{categories.length > 1 && (
							<button
								className="fr-btn fr-btn--tertiary fr-icon-delete-line fr-btn--icon-left fr-btn--sm"
								onClick={() => askRemoveCategory(index)}
								type="button"
							>
								Supprimer
							</button>
						)}
					</div>

					{/* Name field */}
					<div className="fr-input-group fr-mb-0">
						<label className="fr-label" htmlFor={`cat-${index}-name`}>
							Nom
						</label>
						<input
							className="fr-input"
							id={`cat-${index}-name`}
							onChange={(e) => updateCategory(index, "name", e.target.value)}
							type="text"
							value={cat.name}
						/>
					</div>

					{/* Detail field */}
					<div className="fr-input-group fr-mb-0">
						<label className="fr-label" htmlFor={`cat-${index}-detail`}>
							Détail des emplois
						</label>
						<input
							className="fr-input"
							id={`cat-${index}-detail`}
							onChange={(e) => updateCategory(index, "detail", e.target.value)}
							type="text"
							value={cat.detail}
						/>
					</div>

					{/* Data table */}
					{renderCategoryTable(cat, index)}
				</div>
			))}

			{/* Category count + Add button */}
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					gap: "1rem",
				}}
			>
				<p className="fr-text--bold fr-mb-0">
					Nombre de catégories : {categories.length}
				</p>
				<button
					className="fr-btn fr-btn--secondary fr-icon-add-line fr-btn--icon-left"
					onClick={addCategory}
					type="button"
				>
					Ajouter une catégorie d&apos;emplois
				</button>
			</div>

			<DefinitionAccordion id="accordion-step5" />

			{workforceError && (
				<div aria-live="polite" className="fr-alert fr-alert--error">
					<p>{workforceError}</p>
				</div>
			)}

			{mutation.error && (
				<div aria-live="polite" className="fr-alert fr-alert--error">
					<p>{mutation.error.message}</p>
				</div>
			)}

			<FormActions
				isSubmitting={mutation.isPending}
				previousHref="/declaration/etape/4"
			/>

			{/* Delete confirmation dialog */}
			<dialog
				aria-labelledby="delete-category-title"
				className="fr-p-4w"
				ref={deleteDialogRef}
				style={{
					maxWidth: "30rem",
					borderRadius: "0.25rem",
					border: "none",
					boxShadow: "0 6px 18px 0 rgba(0, 0, 18, 0.16)",
				}}
			>
				<div className="fr-grid-row fr-grid-row--right fr-mb-2w">
					<button
						aria-label="Fermer"
						className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-icon-close-line"
						onClick={closeDeleteDialog}
						type="button"
					/>
				</div>

				<h2 className="fr-h4" id="delete-category-title">
					Supprimer la catégorie
				</h2>
				<p>
					Êtes-vous sûr de vouloir supprimer la catégorie
					{deleteIndex !== null
						? ` « ${categories[deleteIndex]?.name || `n°${deleteIndex + 1}`} »`
						: ""}{" "}
					? Cette action est irréversible.
				</p>

				<ul className="fr-btns-group fr-btns-group--inline fr-btns-group--right fr-mt-4w">
					<li>
						<button
							className="fr-btn fr-btn--secondary"
							onClick={closeDeleteDialog}
							type="button"
						>
							Annuler
						</button>
					</li>
					<li>
						<button
							className="fr-btn"
							onClick={confirmRemoveCategory}
							type="button"
						>
							Supprimer
						</button>
					</li>
				</ul>
			</dialog>
		</form>
	);
}
