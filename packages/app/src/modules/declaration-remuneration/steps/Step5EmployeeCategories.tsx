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
import stepStyles from "./Step5EmployeeCategories.module.scss";
import { CategoryDataTable } from "./step5/CategoryDataTable";
import { DeleteCategoryDialog } from "./step5/DeleteCategoryDialog";
import {
	type EmployeeCategory,
	createEmptyCategory,
	deserializeCategories,
	serializeCategories,
} from "./step5/categorySerializer";

let nextCategoryId = 0;
function nextId() {
	return nextCategoryId++;
}

type Step5EmployeeCategoriesProps = {
	initialCategories?: StepCategoryData[];
	maxWomen?: number;
	maxMen?: number;
};

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
			? deserializeCategories(initialCategories, nextId)
			: {
					categories: [createEmptyCategory(nextId())],
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
		onSuccess: () => router.push("/declaration-remuneration/etape/6"),
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

		mutation.mutate({
			step: 5,
			categories: serializeCategories(categories, source),
		});
	}

	return (
		<form className={stepStyles.form} onSubmit={handleSubmit}>
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

			<div className={stepStyles.categoryBlock}>
				<p className="fr-mb-0">
					Cet indicateur permet de mesurer l&apos;écart de rémunération entre
					les femmes et les hommes au sein de chaque catégorie de salariés, en
					distinguant le salaire de base des composantes variables ou
					complémentaires.
				</p>

				<div className={stepStyles.categoryHeader}>
					<p className="fr-mb-0">
						Période de référence pour le calcul des indicateurs : 01/01/
						{referenceYear} - 31/12/{referenceYear}.
					</p>
					<TooltipButton
						id="tooltip-step5-period"
						label="Information sur la période de référence"
					/>
				</div>

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

			<div className={stepStyles.descriptionBlock}>
				<div className={stepStyles.descriptionRow}>
					<p className={`fr-mb-0 ${stepStyles.descriptionTitle}`}>
						Saisissez les données manquantes avant de valider votre indicateur.
					</p>
					<TooltipButton
						id="tooltip-step5-instruction"
						label="Information sur la saisie"
					/>
				</div>
				<p className="fr-mb-0">Tous les champs sont obligatoires.</p>
			</div>

			{categories.map((cat, index) => (
				<div className={stepStyles.categoryBlock} key={cat.id}>
					<div className={stepStyles.categoryFooter}>
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

					<CategoryDataTable
						category={cat}
						categoryIndex={index}
						onPositiveNumberChange={handlePositiveNumberChange}
					/>
				</div>
			))}

			<div className={stepStyles.categoryFooter}>
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
				previousHref="/declaration-remuneration/etape/4"
			/>

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
