import type React from "react";

import {
	CATEGORY_NAME_MAX_LENGTH,
	CATEGORY_NAME_MAX_LENGTH_MESSAGE,
} from "~/modules/declaration-remuneration/schemas";
import stepStyles from "~/modules/declaration-remuneration/steps/Step5EmployeeCategories.module.scss";

import { CategoryDataTable } from "./CategoryDataTable";
import type { EmployeeCategory } from "./categorySerializer";

type Props = {
	baseId: string;
	index: number;
	fieldId: string;
	category: EmployeeCategory & { id: number };
	disabled: boolean;
	isExpanded: boolean;
	readOnlyLabel: boolean;
	showDelete: boolean;
	nameProps: React.ComponentPropsWithRef<"input">;
	nameError?: string;
	onAccordionToggle: (e: React.MouseEvent<HTMLButtonElement>) => void;
	headerRef: (node: HTMLButtonElement | null) => void;
	collapseRef: (node: HTMLDivElement | null) => void;
	onPositiveNumberChange: (
		index: number,
		field: keyof EmployeeCategory,
		isInteger: boolean,
	) => (e: React.ChangeEvent<HTMLInputElement>) => void;
	onDecimalBlur: (index: number, field: keyof EmployeeCategory) => () => void;
	onAskRemove: (index: number) => void;
};

export function CategoryAccordionItem({
	baseId,
	index,
	fieldId,
	category,
	disabled,
	isExpanded,
	readOnlyLabel,
	showDelete,
	nameProps,
	nameError,
	onAccordionToggle,
	headerRef,
	collapseRef,
	onPositiveNumberChange,
	onDecimalBlur,
	onAskRemove,
}: Props) {
	// Derive the accordion id from the row's stable identity, never from its
	// position: DSFR's vanilla JS freezes the id at instantiation and binds its
	// toggle through a literal `[aria-controls="<id>"]` selector. Renumbering
	// ids in place (after a delete) makes the live instance stop matching its
	// own selector and DSFR disposes it, which leaves the accordion unopenable
	// — cf. #4008.
	const collapseId = `${baseId}-accordion-${fieldId}`;
	const headingId = `${collapseId}-heading`;
	const categoryNumber = `Catégorie d'emplois n°${index + 1}`;
	const catName = category.name?.trim() ?? "";
	const categoryLabel = catName
		? `${categoryNumber} : ${catName}`
		: categoryNumber;

	return (
		<section aria-labelledby={headingId} className="fr-accordion">
			<h2 className="fr-accordion__title">
				<button
					aria-controls={collapseId}
					aria-expanded={isExpanded}
					className="fr-accordion__btn"
					id={headingId}
					onClick={onAccordionToggle}
					ref={headerRef}
					type="button"
				>
					{categoryLabel}
				</button>
			</h2>
			<div
				className={`fr-collapse ${isExpanded ? "fr-collapse--expanded" : ""}`}
				id={collapseId}
				ref={collapseRef}
			>
				<div className={stepStyles.categoryBlock}>
					{!readOnlyLabel && (
						<div
							className={
								nameError
									? "fr-input-group fr-mb-0 fr-input-group--error"
									: "fr-input-group fr-mb-0"
							}
						>
							<label className="fr-label" htmlFor={`cat-${index}-name`}>
								Libellé de la catégorie d&apos;emploi
								<span className="fr-hint-text" id={`cat-${index}-name-hint`}>
									{CATEGORY_NAME_MAX_LENGTH_MESSAGE}
								</span>
							</label>
							<input
								aria-describedby={
									nameError
										? `cat-${index}-name-hint cat-${index}-name-error`
										: `cat-${index}-name-hint`
								}
								aria-invalid={nameError ? true : undefined}
								className={nameError ? "fr-input fr-input--error" : "fr-input"}
								disabled={disabled}
								id={`cat-${index}-name`}
								maxLength={CATEGORY_NAME_MAX_LENGTH}
								{...nameProps}
								type="text"
							/>
							{nameError && (
								<p className="fr-error-text" id={`cat-${index}-name-error`}>
									{nameError}
								</p>
							)}
						</div>
					)}
					<CategoryDataTable
						category={category}
						categoryIndex={index}
						disabled={disabled}
						onDecimalBlur={onDecimalBlur}
						onPositiveNumberChange={onPositiveNumberChange}
					/>
					{showDelete && (
						<div className={stepStyles.deleteRow}>
							<button
								className="fr-btn fr-btn--tertiary fr-icon-delete-line fr-btn--icon-left fr-btn--sm"
								disabled={disabled}
								onClick={() => onAskRemove(index)}
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
}
