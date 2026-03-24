"use client";

import { useCallback, useRef, useState } from "react";
import { getDsfrModal } from "~/modules/shared";
import { api } from "~/trpc/react";

const MODAL_ID = "update-cse-modal";

type Props = {
	siren: string;
};

/** Modal to update CSE presence for a company */
export function UpdateCseModal({ siren }: Props) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const [hasCse, setHasCse] = useState<boolean | null>(null);

	const closeModal = useCallback(() => {
		if (dialogRef.current) {
			getDsfrModal(dialogRef.current)?.conceal();
		}
	}, []);

	const mutation = api.company.updateHasCse.useMutation({
		onSuccess: () => {
			closeModal();
		},
	});

	function handleSave() {
		if (hasCse === null) return;
		mutation.mutate({ siren, hasCse });
	}

	return (
		<dialog
			aria-labelledby="update-cse-modal-title"
			className="fr-modal"
			id={MODAL_ID}
			ref={dialogRef}
		>
			<div className="fr-container fr-container--fluid fr-container-md">
				<div className="fr-grid-row fr-grid-row--center">
					<div className="fr-col-12 fr-col-md-8 fr-col-lg-6">
						<div className="fr-modal__body">
							<div className="fr-modal__header">
								<button
									aria-controls={MODAL_ID}
									className="fr-btn--close fr-btn"
									onClick={closeModal}
									title="Fermer"
									type="button"
								>
									Fermer
								</button>
							</div>
							<div className="fr-modal__content">
								<h2 className="fr-modal__title" id="update-cse-modal-title">
									Mettre à jour la présence d&apos;un CSE
								</h2>
								<p className="fr-text--bold">
									Un CSE a-t-il été mis en place ?
								</p>
								<div className="fr-btns-group">
									<button
										className={`fr-btn fr-btn--tertiary${hasCse === true ? "" : "-no-outline"}`}
										onClick={() => setHasCse(true)}
										type="button"
									>
										Oui
									</button>
									<button
										className={`fr-btn fr-btn--tertiary${hasCse === false ? "" : "-no-outline"}`}
										onClick={() => setHasCse(false)}
										type="button"
									>
										Non
									</button>
								</div>
							</div>
							<div className="fr-modal__footer">
								<ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg">
									<li>
										<button
											className="fr-btn"
											disabled={hasCse === null || mutation.isPending}
											onClick={handleSave}
											type="button"
										>
											{mutation.isPending
												? "Enregistrement\u2026"
												: "Enregistrer"}
										</button>
									</li>
									<li>
										<button
											className="fr-btn fr-btn--secondary"
											onClick={closeModal}
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
