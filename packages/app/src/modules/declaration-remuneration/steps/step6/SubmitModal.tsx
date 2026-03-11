"use client";

import { useState } from "react";

import dialogStyles from "~/modules/declaration-remuneration/shared/EditDialog.module.scss";

type Props = {
	modalRef: React.RefObject<HTMLDialogElement | null>;
	onClose: () => void;
	onSubmit: () => void;
	isPending: boolean;
	year: number;
};

/** Confirmation dialog for submitting the declaration with certification checkbox */
export function SubmitModal({
	modalRef,
	onClose,
	onSubmit,
	isPending,
	year,
}: Props) {
	const [certified, setCertified] = useState(false);

	return (
		<dialog
			aria-labelledby="submit-modal-title"
			className={`fr-p-4w ${dialogStyles.dialog}`}
			ref={modalRef}
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
									Vous allez soumettre la déclaration des indicateurs de
									rémunération {year} aux services du ministère chargé du
									travail.
								</p>
								<p className="fr-text--bold">
									Aucune obligation de déclaration ne s&apos;applique dans votre
									cas.
								</p>
								<div className="fr-checkbox-group fr-mt-2w">
									<input
										checked={certified}
										id="submit-certify"
										onChange={(e) => setCertified(e.target.checked)}
										type="checkbox"
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
