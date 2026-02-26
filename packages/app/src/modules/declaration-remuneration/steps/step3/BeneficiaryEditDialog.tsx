"use client";

import type { RefObject } from "react";

import common from "../../shared/common.module.scss";
import dialogStyles from "../../shared/EditDialog.module.scss";

type Props = {
	dialogRef: RefObject<HTMLDialogElement | null>;
	editBenefWomen: string;
	editBenefMen: string;
	maxWomen?: number;
	maxMen?: number;
	benefValidationError: string | null;
	onWomenChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onMenChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onSave: () => void;
	onClose: () => void;
};

export function BeneficiaryEditDialog({
	dialogRef,
	editBenefWomen,
	editBenefMen,
	maxWomen,
	maxMen,
	benefValidationError,
	onWomenChange,
	onMenChange,
	onSave,
	onClose,
}: Props) {
	return (
		<dialog
			aria-labelledby="edit-beneficiary-title"
			className={`fr-p-4w ${dialogStyles.dialog}`}
			ref={dialogRef}
		>
			<div className="fr-grid-row fr-grid-row--right fr-mb-2w">
				<button
					aria-label="Fermer"
					className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-icon-close-line"
					onClick={onClose}
					type="button"
				/>
			</div>

			<h2 className="fr-h4" id="edit-beneficiary-title">
				Modifier les bénéficiaires
			</h2>

			<p className={`fr-text--sm fr-mb-3w ${common.mentionGrey}`}>
				Tous les champs sont obligatoires
			</p>

			<div className="fr-input-group fr-mb-3w">
				<label className="fr-label" htmlFor="edit-benef-women">
					Nombre de bénéficiaires Femmes
				</label>
				<input
					className="fr-input"
					id="edit-benef-women"
					max={maxWomen}
					min="0"
					onChange={onWomenChange}
					type="number"
					value={editBenefWomen}
				/>
			</div>

			<div className="fr-input-group fr-mb-3w">
				<label className="fr-label" htmlFor="edit-benef-men">
					Nombre de bénéficiaires Hommes
				</label>
				<input
					className="fr-input"
					id="edit-benef-men"
					max={maxMen}
					min="0"
					onChange={onMenChange}
					type="number"
					value={editBenefMen}
				/>
			</div>

			{benefValidationError && (
				<div
					aria-live="polite"
					className="fr-alert fr-alert--error fr-alert--sm fr-mb-3w"
				>
					<p>{benefValidationError}</p>
				</div>
			)}

			<ul className="fr-btns-group fr-btns-group--inline fr-btns-group--right fr-mt-4w">
				<li>
					<button
						className="fr-btn fr-btn--secondary"
						onClick={onClose}
						type="button"
					>
						Annuler
					</button>
				</li>
				<li>
					<button className="fr-btn" onClick={onSave} type="button">
						Enregistrer
					</button>
				</li>
			</ul>
		</dialog>
	);
}
