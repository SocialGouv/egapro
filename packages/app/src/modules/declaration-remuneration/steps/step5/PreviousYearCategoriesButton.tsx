"use client";

import { useCallback, useRef } from "react";
import dialogStyles from "~/modules/declaration-remuneration/shared/EditDialog.module.scss";
import { api } from "~/trpc/react";
import type { EmployeeCategory } from "./categorySerializer";
import { createEmptyCategory } from "./categorySerializer";

type Props = {
	onImport: (categories: EmployeeCategory[], source: string) => void;
	hasExistingData: boolean;
	nextId: () => number;
};

export function PreviousYearCategoriesButton({
	onImport,
	hasExistingData,
	nextId,
}: Props) {
	const confirmDialogRef = useRef<HTMLDialogElement>(null);

	const { data: previousYearData } =
		api.declaration.getPreviousYearCategories.useQuery();

	const closeDialog = useCallback(() => {
		confirmDialogRef.current?.close();
	}, []);

	if (!previousYearData) return null;

	function applyPreviousYearCategories() {
		if (!previousYearData) return;

		const categories: EmployeeCategory[] = previousYearData.categories.map(
			(cat) => ({
				...createEmptyCategory(nextId()),
				name: cat.name,
				detail: cat.detail,
			}),
		);

		onImport(categories, previousYearData.source);
		closeDialog();
	}

	function handleClick() {
		if (hasExistingData) {
			confirmDialogRef.current?.showModal();
		} else {
			applyPreviousYearCategories();
		}
	}

	return (
		<>
			<li>
				<button
					className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-icon-arrow-go-back-line fr-btn--icon-left"
					onClick={handleClick}
					type="button"
				>
					Reprendre les catégories de l&apos;année précédente
				</button>
			</li>

			<dialog
				aria-labelledby="previous-year-confirm-title"
				className={`fr-p-4w ${dialogStyles.dialogSmall}`}
				ref={confirmDialogRef}
			>
				<div className="fr-grid-row fr-grid-row--right fr-mb-2w">
					<button
						aria-label="Fermer"
						className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-icon-close-line"
						onClick={closeDialog}
						type="button"
					/>
				</div>

				<h2 className="fr-h4" id="previous-year-confirm-title">
					Reprendre les catégories
				</h2>
				<p>
					Les catégories actuelles seront remplacées par celles de l&apos;année
					précédente. Les données chiffrées ne seront pas reprises.
					Souhaitez-vous continuer ?
				</p>

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
						<button
							className="fr-btn"
							onClick={applyPreviousYearCategories}
							type="button"
						>
							Reprendre
						</button>
					</li>
				</ul>
			</dialog>
		</>
	);
}
