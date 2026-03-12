"use client";

import { useCallback, useState } from "react";

type Props = {
	modalId: string;
	title?: string;
	description: React.ReactNode;
	certifyLabel: string;
	certifyInputId: string;
	modalRef: React.RefObject<HTMLDialogElement | null>;
	onClose: () => void;
	onSubmit: () => void;
};

export function SubmitModal({
	modalId,
	title = "Transmettre",
	description,
	certifyLabel,
	certifyInputId,
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
			aria-labelledby={`${modalId}-title`}
			aria-modal="true"
			className="fr-modal"
			data-fr-concealing-backdrop="false"
			id={modalId}
			ref={modalRef}
		>
			<div className="fr-container fr-container--fluid fr-container-md">
				<div className="fr-grid-row fr-grid-row--center">
					<div className="fr-col-12 fr-col-md-8 fr-col-lg-6">
						<div className="fr-modal__body">
							<div className="fr-modal__header">
								<button
									aria-controls={modalId}
									className="fr-btn--close fr-btn"
									onClick={handleClose}
									title="Fermer"
									type="button"
								>
									Fermer
								</button>
							</div>
							<div className="fr-modal__content">
								<h2 className="fr-modal__title" id={`${modalId}-title`}>
									{title}
								</h2>
								<p>{description}</p>
								<div className="fr-checkbox-group fr-mt-2w">
									<input
										checked={certified}
										id={certifyInputId}
										onChange={(e) => setCertified(e.target.checked)}
										type="checkbox"
									/>
									<label className="fr-label" htmlFor={certifyInputId}>
										{certifyLabel}
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
