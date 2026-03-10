"use client";

import type { ReactNode } from "react";
import { useCallback, useRef, useState } from "react";

import { DefinitionAccordion } from "~/modules/declaration-remuneration/shared/DefinitionAccordion";
import { FormActions } from "~/modules/declaration-remuneration/shared/FormActions";
import { SavedIndicator } from "~/modules/declaration-remuneration/shared/SavedIndicator";
import { TooltipButton } from "~/modules/declaration-remuneration/shared/TooltipButton";
import type { StepCategoryData } from "~/modules/declaration-remuneration/types";
import stepStyles from "../Step5EmployeeCategories.module.scss";
import { CategoryDataTable } from "./CategoryDataTable";
import {
	createEmptyCategory,
	deserializeCategories,
	type EmployeeCategory,
	serializeCategories,
} from "./categorySerializer";
import { DeleteCategoryDialog } from "./DeleteCategoryDialog";

const SOURCE_LABELS: Record<string, string> = {
	"convention-collective": "Convention collective",
	"accord-entreprise": "Accord d'entreprise",
	"classification-interne": "Classification interne",
	autre: "Autre",
};

let nextCategoryId = 0;
function nextId() {
	return nextCategoryId++;
}

type Props = {
	title: ReactNode;
	stepper: ReactNode;
	instructionText: string;
	tooltipPrefix: string;
	accordionId: string;
	previousHref: string;
	initialCategories: StepCategoryData[];
	maxWomen?: number;
	maxMen?: number;
	onSubmit: (serialized: StepCategoryData[]) => void;
	isSubmitting: boolean;
	submitError?: string | null;
	readOnlyNameDetail?: boolean;
	referencePeriodPicker?: ReactNode;
	descriptionText?: string;
};

export function CategoryForm({
	title,
	stepper,
	instructionText,
	tooltipPrefix,
	accordionId,
	previousHref,
	initialCategories,
	maxWomen,
	maxMen,
	onSubmit,
	isSubmitting,
	submitError,
	readOnlyNameDetail = false,
	referencePeriodPicker,
	descriptionText = "Cet indicateur permet de mesurer l'écart de rémunération entre les femmes et les hommes au sein de chaque catégorie de salariés, en distinguant le salaire de base des composantes variables ou complémentaires.",
}: Props) {
	const currentYear = new Date().getFullYear();
	const referenceYear = currentYear - 1;

	const initial =
		initialCategories.length > 0
			? deserializeCategories(initialCategories, nextId)
			: { categories: [createEmptyCategory(nextId())], source: "" };

	const [categories, setCategories] = useState<EmployeeCategory[]>(
		initial.categories,
	);
	const [source, setSource] = useState(initial.source);

	const hasInitialData = initialCategories.some(
		(c) =>
			c.name.startsWith("cat:") &&
			!c.name.match(/^cat:\d+:(name|detail):/) &&
			(c.womenCount !== undefined || c.womenValue !== undefined),
	);
	const [saved, setSaved] = useState(hasInitialData);

	const [workforceError, setWorkforceError] = useState("");
	const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
	const deleteDialogRef = useRef<HTMLDialogElement>(null);

	const closeDeleteDialog = useCallback(() => {
		deleteDialogRef.current?.close();
		setDeleteIndex(null);
	}, []);

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
		setCategories((prev) => [...prev, createEmptyCategory(nextId())]);
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

		onSubmit(serializeCategories(categories, source));
	}

	return (
		<form className={stepStyles.form} onSubmit={handleSubmit}>
			<div className="fr-grid-row fr-grid-row--middle fr-grid-row--gutters">
				<div className="fr-col">{title}</div>
				{saved && (
					<div className="fr-col-auto">
						<SavedIndicator />
					</div>
				)}
			</div>

			{stepper}

			<div className={stepStyles.categoryBlock}>
				<p className="fr-mb-0">{descriptionText}</p>

				{readOnlyNameDetail ? (
					<p className="fr-mb-0">
						Source utilisée pour déterminer les catégories d&apos;emplois :{" "}
						<span className="fr-text--bold">
							{SOURCE_LABELS[source] ?? source}
						</span>
					</p>
				) : (
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
							<option value="convention-collective">
								Convention collective
							</option>
							<option value="accord-entreprise">
								Accord d&apos;entreprise
							</option>
							<option value="classification-interne">
								Classification interne
							</option>
							<option value="autre">Autre</option>
						</select>
					</div>
				)}

				{referencePeriodPicker ?? (
					<div className={stepStyles.categoryHeader}>
						<p className="fr-mb-0">
							Période de référence pour le calcul des indicateurs : 01/01/
							{referenceYear} - 31/12/{referenceYear}.
						</p>
						<TooltipButton
							id={`${tooltipPrefix}-period`}
							label="Information sur la période de référence"
						/>
					</div>
				)}
			</div>

			<div className={stepStyles.descriptionBlock}>
				<div className={stepStyles.descriptionRow}>
					<p className={`fr-mb-0 ${stepStyles.descriptionTitle}`}>
						{instructionText}
					</p>
					<TooltipButton
						id={`${tooltipPrefix}-instruction`}
						label="Information sur la saisie"
					/>
				</div>
				<p className="fr-mb-0">Tous les champs sont obligatoires.</p>
			</div>

			<div className="fr-accordions-group" data-fr-group="false">
				{categories.map((cat, index) => {
					const collapseId = `cat-accordion-${cat.id}`;
					const categoryNumber = `Catégorie d'emplois n°${index + 1}`;
					const categoryLabel = cat.name.trim()
						? `${categoryNumber} : ${cat.name.trim()}`
						: categoryNumber;

					return (
						<section className="fr-accordion" key={cat.id}>
							<h3 className="fr-accordion__title">
								<button
									aria-controls={collapseId}
									aria-expanded="true"
									className="fr-accordion__btn"
									type="button"
								>
									{categoryLabel}
								</button>
							</h3>
							<div
								className="fr-collapse fr-collapse--expanded"
								id={collapseId}
							>
								<div className={stepStyles.categoryBlock}>
									{!readOnlyNameDetail && categories.length > 1 && (
										<div className={stepStyles.categoryFooter}>
											<button
												className="fr-btn fr-btn--tertiary fr-icon-delete-line fr-btn--icon-left fr-btn--sm"
												onClick={() => askRemoveCategory(index)}
												type="button"
											>
												Supprimer
											</button>
										</div>
									)}

									{readOnlyNameDetail ? (
										<>
											<p className="fr-mb-0">
												<span className="fr-text--bold">Nom : </span>
												{cat.name}
											</p>
											<p className="fr-mb-0">
												<span className="fr-text--bold">
													Détail des emplois :{" "}
												</span>
												{cat.detail}
											</p>
										</>
									) : (
										<>
											<div className="fr-input-group fr-mb-0">
												<label
													className="fr-label"
													htmlFor={`cat-${index}-name`}
												>
													Nom
												</label>
												<input
													className="fr-input"
													id={`cat-${index}-name`}
													onChange={(e) =>
														updateCategory(index, "name", e.target.value)
													}
													type="text"
													value={cat.name}
												/>
											</div>

											<div className="fr-input-group fr-mb-0">
												<label
													className="fr-label"
													htmlFor={`cat-${index}-detail`}
												>
													Détail des emplois
												</label>
												<input
													className="fr-input"
													id={`cat-${index}-detail`}
													onChange={(e) =>
														updateCategory(index, "detail", e.target.value)
													}
													type="text"
													value={cat.detail}
												/>
											</div>
										</>
									)}

									<CategoryDataTable
										category={cat}
										categoryIndex={index}
										onPositiveNumberChange={handlePositiveNumberChange}
									/>
								</div>
							</div>
						</section>
					);
				})}
			</div>

			<div className={stepStyles.categoryFooter}>
				<p className="fr-text--bold fr-mb-0">
					Nombre de catégories : {categories.length}
				</p>
				{!readOnlyNameDetail && (
					<button
						className="fr-btn fr-btn--secondary fr-icon-add-line fr-btn--icon-left"
						onClick={addCategory}
						type="button"
					>
						Ajouter une catégorie d&apos;emplois
					</button>
				)}
			</div>

			<DefinitionAccordion
				id={accordionId}
				title="Définitions et méthode de calcul"
			/>

			{workforceError && (
				<div aria-live="polite" className="fr-alert fr-alert--error">
					<p>{workforceError}</p>
				</div>
			)}

			{submitError && (
				<div aria-live="polite" className="fr-alert fr-alert--error">
					<p>{submitError}</p>
				</div>
			)}

			<FormActions isSubmitting={isSubmitting} previousHref={previousHref} />

			<DeleteCategoryDialog
				categoryName={
					deleteIndex !== null
						? categories[deleteIndex]?.name || `n°${deleteIndex + 1}`
						: null
				}
				dialogRef={deleteDialogRef}
				onCancel={closeDeleteDialog}
				onConfirm={confirmRemoveCategory}
			/>
		</form>
	);
}
