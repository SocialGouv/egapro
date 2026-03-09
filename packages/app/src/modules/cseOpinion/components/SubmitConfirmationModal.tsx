"use client";

import { useCallback, useState } from "react";

const MODAL_ID = "cse-submit-modal";

type Props = {
	modalRef: React.RefObject<HTMLDialogElement | null>;
	onClose: () => void;
	onSubmit: () => void;
};

export function SubmitConfirmationModal({
	modalRef,
	onClose,
	onSubmit,
}: Props) {
	const [certified, setCertified] = useState(false);

	const handleClose = useCallback(() => {
		setCertified(false);
		onClose();
	}, [onClose]);

	return (
		<dialog
			aria-labelledby={`${MODAL_ID}-title`}
			aria-modal="true"
			className="fr-modal"
			data-fr-concealing-backdrop="false"
			id={MODAL_ID}
			ref={modalRef}
		>
			<div className="fr-container fr-container--fluid fr-container-md">
				<div className="fr-grid-row fr-grid-row--center">
					<div className="fr-col-12 fr-col-md-8 fr-col-lg-6">
						<div className="fr-modal__body">
							<div className="fr-modal__header">
								<button
									aria-controls={MODAL_ID}
									className="fr-btn--close fr-btn"
									onClick={handleClose}
									title="Fermer"
									type="button"
								>
									Fermer
								</button>
							</div>
							<div className="fr-modal__content">
								<h2 className="fr-modal__title" id={`${MODAL_ID}-title`}>
									Transmettre
								</h2>
								<p>
									Vous allez transmettre aux services du ministère chargé du
									Travail l&apos;avis ou les avis de votre CSE relatifs à
									l&apos;ensemble de votre démarche{" "}
									{new Date().getFullYear() + 1}.
								</p>
								<div className="fr-checkbox-group fr-mt-2w">
									<input
										checked={certified}
										id="cse-submit-certify"
										onChange={(e) => setCertified(e.target.checked)}
										type="checkbox"
									/>
									<label className="fr-label" htmlFor="cse-submit-certify">
										Je certifie que les avis transmis sont conformes.
									</label>
								</div>
							</div>
							<div className="fr-modal__footer">
								<ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg">
									<li>
										<button
											className="fr-btn"
											disabled={!certified}
											onClick={onSubmit}
											type="button"
										>
											Valider
										</button>
									</li>
									<li>
										<button
											className="fr-btn fr-btn--secondary"
											onClick={handleClose}
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
