"use client";

import { useState } from "react";

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
			className="fr-modal"
			id="submit-modal"
			ref={modalRef}
			data-fr-concealing-backdrop="false"
		>
			<div className="fr-container fr-container--fluid fr-container-md">
				<div className="fr-grid-row fr-grid-row--center">
					<div className="fr-col-12 fr-col-md-8 fr-col-lg-6">
						<div className="fr-modal__body">
							<div className="fr-modal__header">
								<button
									aria-controls="submit-modal"
									className="fr-btn--close fr-btn"
									title="Fermer"
									type="button"
								>
									Fermer
								</button>
							</div>
							<div className="fr-modal__content">
								<h2 className="fr-modal__title" id="submit-modal-title">
									Soumettre
								</h2>
								<p>
									Vous allez soumettre les indicateurs suivants aux services du
									ministère chargé du travail :
								</p>
								<ul>
									<li>Écart de rémunération</li>
									<li>Écart de rémunération variable ou complémentaire</li>
									<li>
										Proportion de femmes et d&apos;hommes dans chaque quartile
										de rémunération
									</li>
									<li>Écart de rémunération par catégories de salariés</li>
								</ul>
								<div className="fr-checkbox-group fr-mt-2w">
									<input
										id="submit-certify"
										type="checkbox"
										checked={certified}
										onChange={(e) => setCertified(e.target.checked)}
									/>
									<label className="fr-label" htmlFor="submit-certify">
										Je certifie que les données saisies sont exactes et
										conformes aux informations disponibles dans les systèmes de
										paie et de gestion des ressources humaines de
										l&apos;entreprise.
									</label>
								</div>
							</div>
							<div className="fr-modal__footer">
								<ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg">
									<li>
										<button
											className="fr-btn"
											disabled={!certified || isPending}
											onClick={onSubmit}
											type="button"
										>
											{isPending ? "Envoi en cours\u2026" : "Valider"}
										</button>
									</li>
									<li>
										<button
											className="fr-btn fr-btn--secondary"
											onClick={onClose}
											type="button"
										>
											Annuler
										</button>
									</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			</div>
		</dialog>
	);
}
