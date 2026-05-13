"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useFieldArray } from "react-hook-form";

import { categoryFormSchema } from "~/modules/declaration-remuneration/schemas";
import { DefinitionAccordion } from "~/modules/declaration-remuneration/shared/DefinitionAccordion";
import {
	createDevStep5Categories,
	DEV_STEP5_SOURCE,
} from "~/modules/declaration-remuneration/shared/devFillData";
import { FormActions } from "~/modules/declaration-remuneration/shared/FormActions";
import { FormErrors } from "~/modules/declaration-remuneration/shared/FormErrors";
import { StepTitleRow } from "~/modules/declaration-remuneration/shared/StepTitleRow";
import { TooltipButton } from "~/modules/declaration-remuneration/shared/TooltipButton";
import {
	CATEGORY_SOURCES,
	SOURCE_LABELS,
} from "~/modules/declaration-remuneration/steps/step5/sources";
import type {
	EmployeeCategoryRow,
	EmployeeCategorySubmitData,
} from "~/modules/declaration-remuneration/types";
import { padDecimalOnBlur, padDecimalToTwo } from "~/modules/domain";
import { useZodForm } from "~/modules/shared/useZodForm";
import stepStyles from "../Step5EmployeeCategories.module.scss";
import { CategoryDataTable } from "./CategoryDataTable";
import { CategoryImportExport } from "./CategoryImportExport";
import {
	createEmptyCategory,
	type EmployeeCategory,
	fromDatabaseRows,
	toSubmitData,
} from "./categorySerializer";
import { DeleteCategoryDialog } from "./DeleteCategoryDialog";

function createIdGenerator() {
	let id = 0;
	return () => id++;
}

function toFormValues(cats: EmployeeCategory[]) {
	return cats.map((c) => ({
		name: c.name,
		womenCount: c.womenCount,
		menCount: c.menCount,
		annualBaseWomen: padDecimalToTwo(c.annualBaseWomen),
		annualBaseMen: padDecimalToTwo(c.annualBaseMen),
		annualVariableWomen: padDecimalToTwo(c.annualVariableWomen),
		annualVariableMen: padDecimalToTwo(c.annualVariableMen),
		hourlyBaseWomen: padDecimalToTwo(c.hourlyBaseWomen),
		hourlyBaseMen: padDecimalToTwo(c.hourlyBaseMen),
		hourlyVariableWomen: padDecimalToTwo(c.hourlyVariableWomen),
		hourlyVariableMen: padDecimalToTwo(c.hourlyVariableMen),
	}));
}

type Props = {
	referenceYear: number;
	title: ReactNode;
	stepper: ReactNode;
	instructionText: string;
	tooltipPrefix: string;
	accordionId: string;
	previousHref?: string;
	onPrevious?: () => void;
	isPreviousPending?: boolean;
	onPreviousSubmit?: (data: EmployeeCategorySubmitData) => void;
	initialCategories: EmployeeCategoryRow[];
	initialSource?: string;
	maxWomen?: number;
	maxMen?: number;
	onSubmit: (data: EmployeeCategorySubmitData) => void;
	isSubmitting: boolean;
	submitError?: string | null;
	readOnlyLabel?: boolean;
	referencePeriodPicker?: ReactNode;
	descriptionText?: string;
	disabled?: boolean;
	mimoquageNextHref?: string;
	savedOverride?: boolean;
	onValuesChange?: (values: {
		source: string;
		categories: {
			name: string;
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
		}[];
	}) => void;
	defaultValuesOverride?: {
		source: string;
		categories: {
			name: string;
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
		}[];
	};
};

export function CategoryForm({
	referenceYear,
	title,
	stepper,
	instructionText,
	tooltipPrefix,
	accordionId,
	previousHref,
	onPrevious,
	isPreviousPending = false,
	onPreviousSubmit,
	initialCategories,
	initialSource = "",
	maxWomen,
	maxMen,
	onSubmit,
	isSubmitting,
	submitError,
	readOnlyLabel = false,
	referencePeriodPicker,
	descriptionText = "Cet indicateur permet de mesurer l'écart de rémunération entre les femmes et les hommes au sein de chaque catégorie de salariés, en distinguant le salaire de base des composantes variables ou complémentaires.",
	disabled = false,
	mimoquageNextHref,
	savedOverride,
	onValuesChange,
	defaultValuesOverride,
}: Props) {
	const baseId = useId();
	const nextId = useRef(createIdGenerator()).current;

	const initialCats =
		initialCategories.length > 0
			? fromDatabaseRows(initialCategories, nextId)
			: [createEmptyCategory(nextId())];

	const form = useZodForm(categoryFormSchema, {
		defaultValues: defaultValuesOverride ?? {
			source: initialSource,
			categories: toFormValues(initialCats),
		},
	});

	useEffect(() => {
		if (!onValuesChange) return;
		const sub = form.watch(() => {
			const values = form.getValues();
			onValuesChange({ source: values.source, categories: values.categories });
		});
		return () => sub.unsubscribe();
	}, [form, onValuesChange]);

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "categories",
	});

	const hasInitialData = initialCategories.length > 0;
	const [savedInternal, setSaved] = useState(hasInitialData);
	const saved = savedOverride !== undefined ? savedOverride : savedInternal;
	const [workforceError, setWorkforceError] = useState("");
	const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
	const deleteDialogRef = useRef<HTMLDialogElement>(null);

	const closeDeleteDialog = useCallback(() => {
		deleteDialogRef.current?.close();
		setDeleteIndex(null);
	}, []);

	function handlePositiveNumberChange(
		index: number,
		field: keyof EmployeeCategory,
		isInteger: boolean,
	) {
		return (e: React.ChangeEvent<HTMLInputElement>) => {
			const raw = e.target.value.replace(/\s/g, "").replace(",", ".");
			const formField = field as Exclude<keyof EmployeeCategory, "id">;
			if (raw === "") {
				form.setValue(`categories.${index}.${formField}`, raw);
				setSaved(false);
				return;
			}
			if (isInteger && /\D/.test(raw)) return;
			const n = isInteger ? Number.parseInt(raw, 10) : Number.parseFloat(raw);
			if (Number.isNaN(n) || n < 0) return;
			form.setValue(`categories.${index}.${formField}`, raw);
			setSaved(false);
		};
	}

	function handleDecimalBlur(index: number, field: keyof EmployeeCategory) {
		return () => {
			const formField = field as Exclude<keyof EmployeeCategory, "id">;
			padDecimalOnBlur(
				form.getValues(`categories.${index}.${formField}`),
				(padded) => {
					form.setValue(`categories.${index}.${formField}`, padded);
					setSaved(false);
				},
			);
		};
	}

	function addCategory() {
		const empty = createEmptyCategory(nextId());
		const formEntry = toFormValues([empty])[0];
		if (formEntry) append(formEntry);
		setSaved(false);
	}

	function handleImportCategories(imported: EmployeeCategory[]) {
		form.setValue("categories", toFormValues(imported));
		setSaved(false);
	}

	function askRemoveCategory(index: number) {
		setDeleteIndex(index);
		deleteDialogRef.current?.showModal();
	}

	// DSFR's accordion JS focuses the toggle button after a collapse, which
	// scrolls the page to keep the (now much shorter) page in view — users
	// land at the top instead of staying near the category they just folded.
	// Snapshot the button's viewport offset before the toggle and restore it
	// after the next layout pass so the click feels in-place.
	function handleAccordionToggle(e: React.MouseEvent<HTMLButtonElement>) {
		const button = e.currentTarget;
		const offsetBefore = button.getBoundingClientRect().top;
		requestAnimationFrame(() => {
			const offsetAfter = button.getBoundingClientRect().top;
			const drift = offsetAfter - offsetBefore;
			if (Math.abs(drift) > 1) {
				window.scrollBy({ top: drift, behavior: "instant" });
			}
		});
	}

	function confirmRemoveCategory() {
		if (deleteIndex !== null) {
			remove(deleteIndex);
			setSaved(false);
		}
		closeDeleteDialog();
	}

	const categories = form.watch("categories");
	const sourceError = form.formState.errors.source?.message;

	function runValidatedSubmit(
		callback: (data: EmployeeCategorySubmitData) => void,
	) {
		return form.handleSubmit((data) => {
			setWorkforceError("");

			const emptyNames = data.categories.some((cat) => !cat.name.trim());
			if (emptyNames) {
				setWorkforceError(
					"Le nom de chaque catégorie d'emplois est obligatoire.",
				);
				return;
			}

			const names = data.categories.map((cat) => cat.name.trim().toLowerCase());
			const hasDuplicates = names.length !== new Set(names).size;
			if (hasDuplicates) {
				setWorkforceError(
					"Les noms des catégories d'emplois doivent être uniques.",
				);
				return;
			}

			if (maxWomen !== undefined || maxMen !== undefined) {
				const totalWomen = data.categories.reduce(
					(sum, cat) =>
						sum + (cat.womenCount ? Number.parseInt(cat.womenCount, 10) : 0),
					0,
				);
				const totalMen = data.categories.reduce(
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

			callback(
				toSubmitData(
					data.categories.map((cat, i) => ({
						id: i,
						...cat,
					})),
					data.source,
				),
			);
		});
	}

	const handleFormSubmit = runValidatedSubmit(onSubmit);

	const handlePreviousClick = onPreviousSubmit
		? () => runValidatedSubmit(onPreviousSubmit)()
		: onPrevious;

	return (
		<form className={stepStyles.form} onSubmit={handleFormSubmit}>
			<StepTitleRow
				onDevFill={() => {
					if (maxWomen == null || maxMen == null) return;
					const devCats = createDevStep5Categories(nextId, maxWomen, maxMen);
					form.setValue("categories", toFormValues(devCats));
					form.setValue("source", DEV_STEP5_SOURCE);
					setSaved(false);
				}}
				saved={saved}
				title={title}
			/>

			{stepper}

			<div className={stepStyles.categoryBlock}>
				<p className="fr-mb-0">{descriptionText}</p>

				{readOnlyLabel ? (
					<p className="fr-mb-0">
						Source utilisée pour déterminer les catégories d&apos;emplois :{" "}
						<span className="fr-text--bold">
							{SOURCE_LABELS[form.watch("source")] ?? form.watch("source")}
						</span>
					</p>
				) : (
					<div
						className={`fr-select-group ${
							sourceError ? "fr-select-group--error" : ""
						} ${stepStyles.sourceSelectGroup}`}
					>
						<label className="fr-label" htmlFor="source-select">
							Quelle est la source utilisée pour déterminer les catégories
							d&apos;emplois ?
						</label>
						<select
							aria-describedby={sourceError ? "source-error" : undefined}
							aria-invalid={Boolean(sourceError)}
							className="fr-select"
							disabled={disabled}
							id="source-select"
							{...form.register("source")}
							onChange={(e) => {
								form.setValue("source", e.target.value, {
									shouldValidate: true,
								});
								setSaved(false);
							}}
						>
							<option disabled value="">
								Sélectionner une option
							</option>
							{CATEGORY_SOURCES.map((s) => (
								<option key={s.value} value={s.value}>
									{s.label}
								</option>
							))}
						</select>
						{sourceError && (
							<p className="fr-error-text" id="source-error">
								{sourceError}
							</p>
						)}
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
				<div className={stepStyles.obligatoiresRow}>
					<p className="fr-mb-0">Tous les champs sont obligatoires.</p>
					{!readOnlyLabel && (
						<CategoryImportExport
							disabled={disabled}
							onImport={handleImportCategories}
						/>
					)}
				</div>
			</div>

			<div className="fr-accordions-group" data-fr-group="false">
				{fields.map((field, index) => {
					const cat = categories[index];
					const collapseId = `${baseId}-accordion-${index}`;
					const headingId = `${collapseId}-heading`;
					const categoryNumber = `Catégorie d'emplois n°${index + 1}`;
					const catName = cat?.name?.trim() ?? "";
					const categoryLabel = catName
						? `${categoryNumber} : ${catName}`
						: categoryNumber;

					return (
						<section
							aria-labelledby={headingId}
							className="fr-accordion"
							key={field.id}
						>
							<h2 className="fr-accordion__title">
								<button
									aria-controls={collapseId}
									aria-expanded="true"
									className="fr-accordion__btn"
									id={headingId}
									onClick={handleAccordionToggle}
									type="button"
								>
									{categoryLabel}
								</button>
							</h2>
							<div
								className="fr-collapse fr-collapse--expanded"
								id={collapseId}
							>
								<div className={stepStyles.categoryBlock}>
									{readOnlyLabel ? (
										<p className="fr-mb-0">
											<span className="fr-text--bold">Libellé : </span>
											{cat?.name}
										</p>
									) : (
										<div className="fr-input-group fr-mb-0">
											<label className="fr-label" htmlFor={`cat-${index}-name`}>
												Libellé
											</label>
											<input
												className="fr-input"
												disabled={disabled}
												id={`cat-${index}-name`}
												{...form.register(`categories.${index}.name`)}
												onChange={(e) => {
													form.setValue(
														`categories.${index}.name`,
														e.target.value,
													);
													setSaved(false);
												}}
												type="text"
											/>
										</div>
									)}

									<CategoryDataTable
										category={
											cat ? { id: index, ...cat } : createEmptyCategory(index)
										}
										categoryIndex={index}
										disabled={disabled}
										onDecimalBlur={handleDecimalBlur}
										onPositiveNumberChange={handlePositiveNumberChange}
									/>

									{!readOnlyLabel && fields.length > 1 && (
										<div className={stepStyles.deleteRow}>
											<button
												className="fr-btn fr-btn--tertiary fr-icon-delete-line fr-btn--icon-left fr-btn--sm"
												disabled={disabled}
												onClick={() => askRemoveCategory(index)}
												type="button"
											>
												Supprimer
											</button>
										</div>
									)}
								</div>
							</div>
						</section>
					);
				})}
			</div>

			<div className={stepStyles.categoryFooter}>
				<p className="fr-text--bold fr-mb-0">
					Nombre de catégories : {fields.length}
				</p>
				{!readOnlyLabel && (
					<button
						className="fr-btn fr-btn--secondary fr-icon-add-line fr-btn--icon-left"
						disabled={disabled}
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
			>
				<div className="fr-callout">
					<ul>
						<li>
							Comment importer directement ses données depuis un fichier
							Excel&nbsp;?
						</li>
						<li>
							Où trouver le modèle de fichier pour l&apos;importation&nbsp;?
						</li>
						<li>Que signifie «&nbsp;Salaire de base&nbsp;»&nbsp;?</li>
						<li>
							Que signifie «&nbsp;Rémunération annuelle brute&nbsp;»&nbsp;?
							Est-ce la moyenne ou le total annuel&nbsp;?
						</li>
						<li>Que signifie «&nbsp;Rémunération horaire&nbsp;»&nbsp;?</li>
						<li>
							Comment saisir le nombre d&apos;heures pour un calcul automatique
							du taux horaire&nbsp;?
						</li>
						<li>
							Comment savoir quels accords s&apos;appliquent à mon
							entreprise&nbsp;?
						</li>
					</ul>
				</div>
			</DefinitionAccordion>

			<FormErrors
				mutationError={submitError}
				validationError={workforceError}
			/>

			<FormActions
				isPreviousPending={isPreviousPending}
				isSubmitting={isSubmitting}
				mimoquageNextHref={mimoquageNextHref}
				onPrevious={handlePreviousClick}
				previousHref={previousHref}
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
