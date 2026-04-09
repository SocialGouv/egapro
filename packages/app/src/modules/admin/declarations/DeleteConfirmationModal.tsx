"use client";

import { useCallback, useRef } from "react";

import { getDsfrModal } from "~/modules/shared";

type Props = {
	count: number;
	onConfirm: () => void;
};

const MODAL_ID = "admin-delete-declarations-modal";

export function useDeleteModal() {
	const modalRef = useRef<HTMLDialogElement>(null);

	const open = useCallback(() => {
		if (modalRef.current) {
			getDsfrModal(modalRef.current)?.disclose();
		}
	}, []);

	const close = useCallback(() => {
		if (modalRef.current) {
			getDsfrModal(modalRef.current)?.conceal();
		}
	}, []);

	return { modalRef, open, close };
}

type ModalProps = Props & {
	modalRef: React.RefObject<HTMLDialogElement | null>;
	onClose: () => void;
};

export function DeleteModal({
	count,
	onConfirm,
	modalRef,
	onClose,
}: ModalProps) {
	const handleConfirm = useCallback(() => {
		onClose();
		onConfirm();
	}, [onClose, onConfirm]);

	return (
		<dialog
			aria-labelledby={`${MODAL_ID}-title`}
			aria-modal="true"
			className="fr-modal"
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
									onClick={onClose}
									title="Fermer"
									type="button"
								>
									Fermer
								</button>
							</div>
							<div className="fr-modal__content">
								<h2 className="fr-modal__title" id={`${MODAL_ID}-title`}>
									Confirmer la suppression
								</h2>
								<p>
									Vous êtes sur le point de supprimer{" "}
									<strong>
										{count} déclaration{count > 1 ? "s" : ""}
									</strong>
									. Cette action est irréversible.
								</p>
							</div>
							<div className="fr-modal__footer">
								<ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg">
									<li>
										<button
											className="fr-btn fr-btn--primary"
											onClick={handleConfirm}
											type="button"
										>
											Supprimer
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
