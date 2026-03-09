"use client";

import { useState } from "react";

import dialogStyles from "~/modules/declaration-remuneration/shared/EditDialog.module.scss";

type Props = {
	modalRef: React.RefObject<HTMLDialogElement | null>;
	onClose: () => void;
	onSubmit: () => void;
	isPending: boolean;
};

/** Confirmation dialog for submitting the declaration with certification checkbox */
export function SubmitModal({ modalRef, onClose, onSubmit, isPending }: Props) {
	const [certified, setCertified] = useState(false);

	return (
		<dialog
			aria-labelledby="submit-modal-title"
			className={`fr-p-4w ${dialogStyles.dialog}`}
			ref={modalRef}
		>
			<h2 className="fr-h4" id="submit-modal-title">
				Soumettre
			</h2>
			<p>
				Vous allez soumettre les indicateurs suivants aux services du ministère
				chargé du travail :
			</p>
			<ul>
				<li>Écart de rémunération</li>
				<li>Écart de rémunération variable ou complémentaire</li>
				<li>
					Proportion de femmes et d&apos;hommes dans chaque quartile de
					rémunération
				</li>
				<li>Écart de rémunération par catégories de salariés</li>
			</ul>
			<div className="fr-checkbox-group fr-mt-2w">
				<input
					checked={certified}
					id="submit-certify"
					onChange={(e) => setCertified(e.target.checked)}
					type="checkbox"
				/>
				<label className="fr-label" htmlFor="submit-certify">
					Je certifie que les données saisies sont exactes et conformes aux
					informations disponibles dans les systèmes de paie et de gestion des
					ressources humaines de l&apos;entreprise.
				</label>
			</div>
			<div className="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg fr-mt-4w">
				<button
					className="fr-btn"
					disabled={!certified || isPending}
					onClick={onSubmit}
					type="button"
				>
					{isPending ? "Envoi en cours\u2026" : "Valider"}
				</button>
				<button
					className="fr-btn fr-btn--secondary"
					onClick={onClose}
					type="button"
				>
					Annuler
				</button>
			</div>
		</dialog>
	);
}
