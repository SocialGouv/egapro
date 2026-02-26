"use client";

import type { RefObject } from "react";

import common from "../../shared/common.module.scss";
import dialogStyles from "../../shared/EditDialog.module.scss";
import {
	GAP_LEVEL_LABELS,
	gapBadgeClass,
	gapLevel,
	formatGap,
} from "../../shared/gapUtils";
import stepStyles from "../Step3VariablePay.module.scss";

type Props = {
	dialogRef: RefObject<HTMLDialogElement | null>;
	label: string | undefined;
	editWomenValue: string;
	editMenValue: string;
	editGap: number | null;
	onWomenChange: (value: string) => void;
	onMenChange: (value: string) => void;
	onSave: () => void;
	onClose: () => void;
};

export function PayGapEditDialog({
	dialogRef,
	label,
	editWomenValue,
	editMenValue,
	editGap,
	onWomenChange,
	onMenChange,
	onSave,
	onClose,
}: Props) {
	function handlePositiveChange(setter: (v: string) => void) {
		return (e: React.ChangeEvent<HTMLInputElement>) => {
			const val = e.target.value;
			if (val === "" || Number.parseFloat(val) >= 0) {
				setter(val);
			}
		};
	}

	const level = gapLevel(editGap);

	return (
		<dialog
			aria-labelledby="edit-variable-pay-title"
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

			<h2 className="fr-h4" id="edit-variable-pay-title">
				Modifier les données
			</h2>

			{label && <p className="fr-text--bold fr-mb-1v">{label}</p>}
			<p className={`fr-text--sm fr-mb-3w ${common.mentionGrey}`}>
				Tous les champs sont obligatoires
			</p>

			<div className="fr-input-group fr-mb-3w">
				<label className="fr-label" htmlFor="edit-women-variable-pay">
					Rémunération Femmes
				</label>
				<input
					className="fr-input"
					id="edit-women-variable-pay"
					min="0"
					onChange={handlePositiveChange(onWomenChange)}
					type="number"
					value={editWomenValue}
				/>
			</div>

			<div className="fr-input-group fr-mb-3w">
				<label className="fr-label" htmlFor="edit-men-variable-pay">
					Rémunération Hommes
				</label>
				<input
					className="fr-input"
					id="edit-men-variable-pay"
					min="0"
					onChange={handlePositiveChange(onMenChange)}
					type="number"
					value={editMenValue}
				/>
			</div>

			<div className="fr-mb-3w">
				<label className="fr-label" htmlFor="edit-variable-gap">
					Écart
				</label>
				<p
					className={`fr-mb-0 fr-mt-1w ${stepStyles.gapDisplay}`}
					id="edit-variable-gap"
				>
					<span className="fr-text--bold">{formatGap(editGap)}</span>
					{level && (
						<span className={gapBadgeClass(level)}>
							{GAP_LEVEL_LABELS[level]}
						</span>
					)}
				</p>
			</div>

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
