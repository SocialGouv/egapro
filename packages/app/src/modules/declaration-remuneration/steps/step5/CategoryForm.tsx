"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useFieldArray } from "react-hook-form";

import type { CategoryFormValues } from "~/modules/declaration-remuneration/schemas";
import {
	CATEGORY_PAY_FIELDS,
	categoryFormSchema,
} from "~/modules/declaration-remuneration/schemas";
import common from "~/modules/declaration-remuneration/shared/common.module.scss";
import { DefinitionAccordion } from "~/modules/declaration-remuneration/shared/DefinitionAccordion";
import {
	createDevStep5Categories,
	DEV_STEP5_SOURCE,
} from "~/modules/declaration-remuneration/shared/devFillData";
import { FormActions } from "~/modules/declaration-remuneration/shared/FormActions";
import { FormErrors } from "~/modules/declaration-remuneration/shared/FormErrors";
import { FieldErrorAlert } from "~/modules/declaration-remuneration/shared/formError/FieldErrorAlert";
import type { FieldError } from "~/modules/declaration-remuneration/shared/formError/types";
import {
	describedByForField,
	findFieldError,
} from "~/modules/declaration-remuneration/shared/formError/types";
import { StepTitleRow } from "~/modules/declaration-remuneration/shared/StepTitleRow";
import {
	CATEGORY_SOURCES,
	formatCategorySource,
} from "~/modules/declaration-remuneration/steps/step5/sources";
import type {
	EmployeeCategoryRow,
	EmployeeCategorySubmitData,
} from "~/modules/declaration-remuneration/types";
import {
	isCategoryPayApplicable,
	padDecimalOnBlur,
	padDecimalToTwo,
	sumCategoryWorkforce,
} from "~/modules/domain";
import { getDsfrCollapse } from "~/modules/shared";
import { TooltipButton } from "~/modules/shared/TooltipButton";
import { useZodForm } from "~/modules/shared/useZodForm";
import stepStyles from "../Step5EmployeeCategories.module.scss";
import { WORKFORCE_ROWS } from "../step1/workforceRows";
import { CategoryAccordionItem } from "./CategoryAccordionItem";
import { categoryDataFieldId } from "./CategoryDataTable";
import { CategoryImportExport } from "./CategoryImportExport";
import {
	collectCategoryPayErrors,
	payFieldsForCountField,
} from "./categoryPayErrors";
import {
	createEmptyCategory,
	type EmployeeCategory,
	fromDatabaseRows,
	toCategoryHeadcounts,
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
		hourlyWomenCount: c.hourlyWomenCount,
		hourlyMenCount: c.hourlyMenCount,
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
	previousHref: string;
	initialCategories: EmployeeCategoryRow[];
	initialSource?: string;
	maxWomen?: number;
	maxMen?: number;
	hourlyMaxWomen?: number;
	hourlyMaxMen?: number;
	/** Reminder shown under the description on the first declaration only. */
	reminderText?: string;
	onSubmit: (data: EmployeeCategorySubmitData) => void;
	isSubmitting: boolean;
	submitError?: string | null;
	readOnlyLabel?: boolean;
	referencePeriodPicker?: ReactNode;
	descriptionText?: string;
	disabled?: boolean;
	readOnly?: boolean;
	nextHref?: string;
	mimoquageNextHref?: string;
	hasDataOverride?: boolean;
	isSavingOverride?: boolean;
	isPendingSaveOverride?: boolean;
	onValuesChange?: (values: CategoryFormValues) => void;
	defaultValuesOverride?: CategoryFormValues;
};

const CATEGORY_ALERT_ID = "step5-categories-error";
// The step-5 checks are form-level (a source not picked, totals that do not
// reconcile), so they anchor on the form itself rather than on one cell.
const CATEGORY_FORM_FIELD_ID = "step5-categories";

export function CategoryForm({
	referenceYear,
	title,
	stepper,
	instructionText,
	tooltipPrefix,
	accordionId,
	previousHref,
	initialCategories,
	initialSource = "",
	maxWomen,
	maxMen,
	hourlyMaxWomen,
	hourlyMaxMen,
	reminderText,
	onSubmit,
	isSubmitting,
	submitError,
	readOnlyLabel = false,
	referencePeriodPicker,
	descriptionText = "Cet indicateur permet de mesurer l'écart de rémunération entre les femmes et les hommes au sein de chaque catégorie de salariés, en distinguant le salaire de base des composantes variables ou complémentaires.",
	disabled = false,
	readOnly = false,
	nextHref,
	mimoquageNextHref,
	hasDataOverride,
	isSavingOverride = false,
	isPendingSaveOverride = false,
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

	const { fields, append, remove, replace } = useFieldArray({
		control: form.control,
		name: "categories",
	});

	const hasInitialData = initialCategories.length > 0;
	const [hasDataInternal, setHasData] = useState(hasInitialData);
	const hasData =
		hasDataOverride !== undefined ? hasDataOverride : hasDataInternal;
	const [categoryErrors, setCategoryErrors] = useState<FieldError[]>([]);
	const [validationAttempt, setValidationAttempt] = useState(0);
	const [expandedByFieldId, setExpandedByFieldId] = useState<
		Record<string, boolean>
	>({});
	const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
	const deleteDialogRef = useRef<HTMLDialogElement>(null);
	const accordionHeaderRefs = useRef<Array<HTMLButtonElement | null>>([]);
	const accordionCollapseRefs = useRef<Array<HTMLDivElement | null>>([]);
	const pendingFocusIndex = useRef<number | null>(null);

	useEffect(() => {
		if (pendingFocusIndex.current === null) return;
		const index = pendingFocusIndex.current;
		pendingFocusIndex.current = null;
		const reveal = () => {
			const collapse = accordionCollapseRefs.current[index];
			if (collapse) getDsfrCollapse(collapse)?.disclose();
			// Focus the new category's first field (the "Libellé" input) rather than
			// the accordion header, so the user can start filling it in immediately.
			const firstField = document.getElementById(`cat-${index}-name`);
			(firstField ?? accordionHeaderRefs.current[index])?.focus();
		};
		const id = window.requestAnimationFrame(reveal);
		return () => window.cancelAnimationFrame(id);
	});

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
			const changedFieldId = categoryDataFieldId(index, field);
			// A headcount drives every pay cell of its category, a pay cell only
			// drives its own error.
			const isCountField = payFieldsForCountField(field).length > 0;
			const categoryPayFieldIds = new Set(
				isCountField
					? CATEGORY_PAY_FIELDS.map((payField) =>
							categoryDataFieldId(index, payField),
						)
					: [],
			);
			if (raw === "") {
				form.setValue(`categories.${index}.${formField}`, raw);
				// An emptied headcount is no longer an explicit 0, so the category
				// declares pay again: its inconsistencies are gone (#3678).
				setCategoryErrors((errors) =>
					errors.filter(
						(error) =>
							error.fieldId !== changedFieldId &&
							!(
								error.category === "inconsistent" &&
								categoryPayFieldIds.has(error.fieldId)
							),
					),
				);
				setHasData(false);
				return;
			}
			if (isInteger && /\D/.test(raw)) return;
			const n = isInteger ? Number.parseInt(raw, 10) : Number.parseFloat(raw);
			if (Number.isNaN(n) || n < 0) return;
			form.setValue(`categories.${index}.${formField}`, raw);
			setCategoryErrors((errors) =>
				errors.filter((error) => {
					if (error.fieldId === changedFieldId) return false;
					if (error.fieldId === CATEGORY_FORM_FIELD_ID)
						return error.category === "invalid";
					if (!categoryPayFieldIds.has(error.fieldId)) return true;
					// A headcount at 0 releases every pay cell of its category, which
					// then declares no remuneration at all (#3678). Any other headcount
					// only clears the inconsistency that 0 had raised.
					return n !== 0 && error.category !== "inconsistent";
				}),
			);
			setHasData(false);
		};
	}

	function handleDecimalBlur(index: number, field: keyof EmployeeCategory) {
		return () => {
			const formField = field as Exclude<keyof EmployeeCategory, "id">;
			padDecimalOnBlur(
				form.getValues(`categories.${index}.${formField}`),
				(padded) => {
					form.setValue(`categories.${index}.${formField}`, padded);
					setHasData(false);
				},
			);
		};
	}

	function addCategory() {
		const empty = createEmptyCategory(nextId());
		const formEntry = toFormValues([empty])[0];
		if (formEntry) {
			pendingFocusIndex.current = fields.length;
			append(formEntry);
		}
		setCategoryErrors([]);
		setHasData(false);
	}

	function handleImportCategories(imported: EmployeeCategory[]) {
		replace(toFormValues(imported));
		setCategoryErrors([]);
		setHasData(false);
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
	function handleAccordionToggle(
		e: React.MouseEvent<HTMLButtonElement>,
		fieldId: string,
	) {
		const button = e.currentTarget;
		const offsetBefore = button.getBoundingClientRect().top;
		requestAnimationFrame(() => {
			const offsetAfter = button.getBoundingClientRect().top;
			const drift = offsetAfter - offsetBefore;
			if (Math.abs(drift) > 1) {
				window.scrollBy({ top: drift, behavior: "instant" });
			}
			setExpandedByFieldId((prev) => ({
				...prev,
				[fieldId]: button.getAttribute("aria-expanded") === "true",
			}));
		});
	}

	function confirmRemoveCategory() {
		if (deleteIndex !== null) {
			remove(deleteIndex);
			setCategoryErrors([]);
			setHasData(false);
		}
		closeDeleteDialog();
	}

	const categories = form.watch("categories");
	const sourceSummaryError = findFieldError(categoryErrors, "source-select");

	function handleErrorAnchorClick(error: FieldError) {
		const match = /^cat-(\d+)-/.exec(error.fieldId);
		if (!match) return;
		const index = Number.parseInt(match[1] ?? "", 10);
		const field = fields[index];
		if (!field) return;
		setExpandedByFieldId((expanded) => ({ ...expanded, [field.id]: true }));
		requestAnimationFrame(() => {
			const collapse = accordionCollapseRefs.current[index];
			if (collapse) getDsfrCollapse(collapse)?.disclose();
			requestAnimationFrame(() =>
				document.getElementById(error.fieldId)?.focus(),
			);
		});
	}

	const handleFormSubmit = form.handleSubmit(
		(data) => {
			setValidationAttempt((attempt) => attempt + 1);
			setCategoryErrors([]);

			const emptyNameIndex = data.categories.findIndex(
				(cat) => !cat.name.trim(),
			);
			if (emptyNameIndex >= 0) {
				form.setError(`categories.${emptyNameIndex}.name`, {
					message: "Le nom de chaque catégorie d'emplois est obligatoire.",
				});
				setCategoryErrors([
					{
						fieldId: `cat-${emptyNameIndex}-name`,
						category: "empty",
						message: "Le nom de chaque catégorie d'emplois est obligatoire.",
						anchor: true,
					},
				]);
				return;
			}

			const names = data.categories.map((cat) => cat.name.trim().toLowerCase());
			const hasDuplicates = names.length !== new Set(names).size;
			if (hasDuplicates) {
				setCategoryErrors([
					{
						fieldId: CATEGORY_FORM_FIELD_ID,
						category: "invalid",
						message: "Les noms des catégories d'emplois doivent être uniques.",
					},
				]);
				return;
			}

			const payErrors = collectCategoryPayErrors(data.categories);
			if (payErrors.length > 0) {
				setCategoryErrors(payErrors);
				return;
			}

			const maxByBasis = {
				annual: { women: maxWomen, men: maxMen },
				hourly: { women: hourlyMaxWomen, men: hourlyMaxMen },
			} as const;
			const sums = sumCategoryWorkforce(data.categories);
			const workforceErrors: FieldError[] = [];
			for (const row of WORKFORCE_ROWS) {
				for (const [sex, sexLabel] of [
					["women", "femmes"],
					["men", "hommes"],
				] as const) {
					const max = maxByBasis[row.basis][sex];
					const total = sums[row.basis][sex];
					if (max === undefined || total === max) continue;
					workforceErrors.push({
						fieldId: CATEGORY_FORM_FIELD_ID,
						category: "inconsistent",
						message: `Le total des effectifs ${sexLabel} de la ligne « ${row.label} » (${total}) ne correspond pas à l'effectif déclaré à l'étape 1 (${max}).`,
					});
				}
			}
			if (workforceErrors.length > 0) {
				setCategoryErrors(workforceErrors);
				return;
			}

			onSubmit(
				toSubmitData(
					data.categories.map((cat, i) => ({
						id: i,
						...cat,
					})),
					data.source,
				),
			);
		},
		(errors) => {
			setValidationAttempt((attempt) => attempt + 1);
			const invalidErrors: FieldError[] = [];
			if (errors.source) {
				invalidErrors.push({
					fieldId: "source-select",
					category: "empty",
					message:
						errors.source.message?.toString() ??
						"Veuillez sélectionner la source utilisée pour déterminer les catégories d'emplois.",
					anchor: true,
				});
			}
			if (Array.isArray(errors.categories)) {
				errors.categories.forEach((categoryError, index) => {
					if (!categoryError?.name) return;
					invalidErrors.push({
						fieldId: `cat-${index}-name`,
						category: "invalid",
						message:
							categoryError.name.message?.toString() ??
							"Le libellé de la catégorie d'emploi est invalide.",
						anchor: true,
					});
				});
			}
			setCategoryErrors(invalidErrors);
		},
	);

	return (
		<form
			autoComplete="off"
			className={stepStyles.form}
			onSubmit={handleFormSubmit}
		>
			<StepTitleRow
				devFillDisabled={disabled || readOnly}
				hasData={hasData}
				isPendingSave={isPendingSaveOverride}
				isSaving={isSavingOverride}
				onDevFill={() => {
					if (
						maxWomen == null ||
						maxMen == null ||
						hourlyMaxWomen == null ||
						hourlyMaxMen == null
					) {
						return;
					}
					const devCats = createDevStep5Categories(nextId, {
						annual: { women: maxWomen, men: maxMen },
						hourly: { women: hourlyMaxWomen, men: hourlyMaxMen },
					});
					replace(toFormValues(devCats));
					form.setValue("source", DEV_STEP5_SOURCE);
					setCategoryErrors([]);
					setHasData(false);
				}}
				title={title}
			/>

			{stepper}

			<div className={stepStyles.categoryBlock}>
				<p className="fr-mb-0">
					{descriptionText}
					{reminderText ? (
						<>
							<br />
							{reminderText}
						</>
					) : null}
				</p>
				{readOnlyLabel && (
					<p className="fr-mb-0">
						Source utilisée pour déterminer les catégories d&apos;emplois :{" "}
						<span className="fr-text--bold">
							{formatCategorySource(form.watch("source"))}
						</span>
					</p>
				)}
				<p className="fr-mb-0">Tous les champs sont obligatoires.</p>

				{referencePeriodPicker ?? (
					<div className={stepStyles.categoryHeader}>
						<p className="fr-mb-0">
							Période de référence pour le calcul des indicateurs :{" "}
							<span className={stepStyles.periodDate}>
								01/01/{referenceYear} - 31/12/{referenceYear}.
							</span>
						</p>
						<TooltipButton
							id={`${tooltipPrefix}-period`}
							label="Information sur la période de référence"
						/>
					</div>
				)}

				{!readOnlyLabel && (
					<div
						className={`fr-select-group ${
							sourceSummaryError ? "fr-select-group--error" : ""
						} ${stepStyles.sourceSelectGroup}`}
					>
						<label className="fr-label" htmlFor="source-select">
							Quelle est la source utilisée pour déterminer les catégories
							d&apos;emplois ?
						</label>
						<select
							aria-describedby={describedByForField(
								CATEGORY_ALERT_ID,
								sourceSummaryError,
							)}
							aria-invalid={sourceSummaryError ? true : undefined}
							className="fr-select"
							disabled={disabled || readOnly}
							id="source-select"
							{...form.register("source")}
							onChange={(e) => {
								form.setValue("source", e.target.value, {
									shouldValidate: true,
								});
								form.clearErrors("source");
								setCategoryErrors((errors) =>
									errors.filter((error) => error.fieldId !== "source-select"),
								);
								setHasData(false);
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
				{!readOnlyLabel && (
					<CategoryImportExport
						disabled={disabled || readOnly}
						onImport={handleImportCategories}
					/>
				)}
			</div>

			<fieldset
				className={`${common.readOnlyFieldset} ${common.flexColumnGap2}`}
				id={CATEGORY_FORM_FIELD_ID}
			>
				<legend className="fr-sr-only">Catégories d&apos;emplois</legend>
				<div className="fr-accordions-group" data-fr-group="false">
					{fields.map((field, index) => {
						const cat = categories[index];
						// A category at 0 that carries no amount is greyed out; one that
						// still carries amounts stays operable so it can be fixed (#3678).
						const payDisabled = cat
							? !isCategoryPayApplicable(toCategoryHeadcounts(cat)) &&
								!CATEGORY_PAY_FIELDS.some(
									(payField) => cat[payField].trim() !== "",
								)
							: false;
						return (
							<CategoryAccordionItem
								baseId={baseId}
								category={
									cat ? { id: index, ...cat } : createEmptyCategory(index)
								}
								collapseRef={(node) => {
									accordionCollapseRefs.current[index] = node;
								}}
								disabled={disabled}
								errorAlertId={CATEGORY_ALERT_ID}
								errors={categoryErrors}
								fieldId={field.id}
								headerRef={(node) => {
									accordionHeaderRefs.current[index] = node;
								}}
								index={index}
								isExpanded={expandedByFieldId[field.id] ?? true}
								key={field.id}
								nameError={
									form.formState.errors.categories?.[index]?.name?.message
								}
								nameProps={{
									...form.register(`categories.${index}.name`),
									onChange: (e) => {
										form.setValue(`categories.${index}.name`, e.target.value);
										form.clearErrors(`categories.${index}.name`);
										setCategoryErrors((errors) =>
											errors.filter(
												(error) =>
													error.fieldId !== `cat-${index}-name` &&
													(error.fieldId !== CATEGORY_FORM_FIELD_ID ||
														error.category !== "invalid"),
											),
										);
										setHasData(false);
									},
								}}
								onAccordionToggle={(e) => handleAccordionToggle(e, field.id)}
								onAskRemove={askRemoveCategory}
								onDecimalBlur={handleDecimalBlur}
								onPositiveNumberChange={handlePositiveNumberChange}
								payDisabled={payDisabled}
								readOnly={readOnly}
								readOnlyLabel={readOnlyLabel}
								showDelete={!readOnlyLabel && !readOnly && fields.length > 1}
							/>
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
							disabled={disabled || readOnly}
							onClick={addCategory}
							type="button"
						>
							Ajouter une catégorie d&apos;emplois
						</button>
					)}
				</div>
			</fieldset>

			<FieldErrorAlert
				errors={categoryErrors}
				id={CATEGORY_ALERT_ID}
				onErrorAnchorClick={handleErrorAnchorClick}
				validationAttempt={validationAttempt}
			/>

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

			<FormErrors mutationError={submitError} />

			<FormActions
				className="fr-mt-0"
				isSubmitting={isSubmitting}
				mimoquageNextHref={mimoquageNextHref}
				nextHref={nextHref}
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
