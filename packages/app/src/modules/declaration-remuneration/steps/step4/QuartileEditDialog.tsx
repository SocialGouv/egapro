"use client";

import type { RefObject } from "react";

import common from "../../shared/common.module.scss";
import dialogStyles from "../../shared/EditDialog.module.scss";

const QUARTILE_NAMES = [
	"1er quartile",
	"2e quartile",
	"3e quartile",
	"4e quartile",
] as const;

type Props = {
	dialogRef: RefObject<HTMLDialogElement | null>;
	dialogTitle: string;
	dialogSubtitle: string;
	isRemuneration: boolean;
	editValues: string[];
	editTotal: number;
	validationError: string | null;
	onValueChange: (
		index: number,
	) => (e: React.ChangeEvent<HTMLInputElement>) => void;
	onSave: () => void;
	onClose: () => void;
};

export function QuartileEditDialog({
	dialogRef,
	dialogTitle,
	dialogSubtitle,
	isRemuneration,
	editValues,
	editTotal,
	validationError,
	onValueChange,
	onSave,
	onClose,
}: Props) {
	return (
		<dialog
			aria-labelledby="edit-quartile-title"
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

			<h2 className="fr-h4" id="edit-quartile-title">
				{dialogTitle}
			</h2>

			<p className="fr-text--bold fr-mb-1v">{dialogSubtitle}</p>
			<p className={`fr-text--sm fr-mb-3w ${common.mentionGrey}`}>
				Tous les champs sont obligatoires
			</p>

			{QUARTILE_NAMES.map((name, i) => (
				<div className="fr-input-group fr-mb-3w" key={name}>
					<label className="fr-label" htmlFor={`edit-q${i}`}>
						{name}
						{isRemuneration && (
							<span className="fr-hint-text">Montant en euros</span>
						)}
					</label>
					<input
						className="fr-input"
						id={`edit-q${i}`}
						min="0"
						onChange={onValueChange(i)}
						step={isRemuneration ? "any" : "1"}
						type="number"
						value={editValues[i] ?? ""}
					/>
				</div>
			))}

			{/* Computed total for count dialogs */}
			{!isRemuneration && (
				<div className="fr-input-group fr-mb-3w">
					<p className="fr-label" id="edit-total-label">
						Total
					</p>
					<output className="fr-text--bold">{editTotal}</output>
				</div>
			)}

			{validationError && (
				<div
					aria-live="polite"
					className="fr-alert fr-alert--error fr-alert--sm fr-mb-3w"
				>
					<p>{validationError}</p>
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
