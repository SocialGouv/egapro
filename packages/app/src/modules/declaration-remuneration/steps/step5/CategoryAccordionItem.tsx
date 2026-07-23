import type React from "react";

import stepStyles from "~/modules/declaration-remuneration/steps/Step5EmployeeCategories.module.scss";

import { CategoryDataTable } from "./CategoryDataTable";
import type { EmployeeCategory } from "./categorySerializer";

type Props = {
	baseId: string;
	index: number;
	category: EmployeeCategory & { id: number };
	disabled: boolean;
	readOnlyLabel: boolean;
	showDelete: boolean;
	nameProps: React.ComponentPropsWithRef<"input">;
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
	category,
	disabled,
	readOnlyLabel,
	showDelete,
	nameProps,
	onAccordionToggle,
	headerRef,
	collapseRef,
	onPositiveNumberChange,
	onDecimalBlur,
	onAskRemove,
}: Props) {
	const collapseId = `${baseId}-accordion-${index}`;
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
					aria-expanded="true"
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
				className="fr-collapse fr-collapse--expanded"
				id={collapseId}
				ref={collapseRef}
			>
				<div className={stepStyles.categoryBlock}>
					{!readOnlyLabel && (
						<div className="fr-input-group fr-mb-0">
							<label className="fr-label" htmlFor={`cat-${index}-name`}>
								Libellé de la catégorie d&apos;emploi
							</label>
							<input
								className="fr-input"
								disabled={disabled}
								id={`cat-${index}-name`}
								{...nameProps}
								type="text"
							/>
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
