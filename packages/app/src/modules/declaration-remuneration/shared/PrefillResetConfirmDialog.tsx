import type { RefObject } from "react";
import dialogStyles from "./EditDialog.module.scss";

type Props = {
	dialogRef: RefObject<HTMLDialogElement | null>;
	onConfirm: () => void;
	onCancel: () => void;
};

export function PrefillResetConfirmDialog({
	dialogRef,
	onConfirm,
	onCancel,
}: Props) {
	return (
		<dialog
			aria-labelledby="prefill-reset-title"
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

			<h2 className="fr-h4" id="prefill-reset-title">
				Confirmation de modification
			</h2>
			<p>
				Vous avez modifié l&apos;effectif. En continuant, les données devront
				être renseignées pour l&apos;ensemble de la suite des indicateurs.
			</p>
			<p>Êtes-vous sûr de vouloir continuer&nbsp;?</p>

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
						Continuer
					</button>
				</li>
			</ul>
		</dialog>
	);
}
