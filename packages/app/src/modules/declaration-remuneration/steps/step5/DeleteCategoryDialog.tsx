import type { RefObject } from "react";
import dialogStyles from "../../shared/EditDialog.module.scss";

type Props = {
	dialogRef: RefObject<HTMLDialogElement | null>;
	categoryName: string | null;
	onConfirm: () => void;
	onCancel: () => void;
};

export function DeleteCategoryDialog({
	dialogRef,
	categoryName,
	onConfirm,
	onCancel,
}: Props) {
	return (
		<dialog
			aria-labelledby="delete-category-title"
			className={`fr-p-4w ${dialogStyles.dialogSmall}`}
			ref={dialogRef}
		>
			<div className="fr-grid-row fr-grid-row--right fr-mb-2w">
				<button
					aria-label="Fermer"
					className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-icon-close-line"
					onClick={onCancel}
					type="button"
				/>
			</div>

			<h2 className="fr-h4" id="delete-category-title">
				Supprimer la catégorie
			</h2>
			<p>
				Êtes-vous sûr de vouloir supprimer la catégorie
				{categoryName ? ` « ${categoryName} »` : ""} ? Cette action est
				irréversible.
			</p>

			<ul className="fr-btns-group fr-btns-group--inline fr-btns-group--right fr-mt-4w">
				<li>
					<button
						className="fr-btn fr-btn--secondary"
						onClick={onCancel}
						type="button"
					>
						Annuler
					</button>
				</li>
				<li>
					<button className="fr-btn" onClick={onConfirm} type="button">
						Supprimer
					</button>
				</li>
			</ul>
		</dialog>
	);
}
