"use client";

import { useCallback, useRef, useState } from "react";
import { useReadOnlyGuard } from "~/modules/auth";
import { getDsfrModal } from "~/modules/shared";
import { api } from "~/trpc/react";
import styles from "./UpdateCseModal.module.scss";

const MODAL_ID = "update-cse-modal";

type Props = {
	siren: string;
};

/** Modal to update CSE presence for a company */
export function UpdateCseModal({ siren }: Props) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const [hasCse, setHasCse] = useState<boolean | null>(null);
	const readOnlyGuard = useReadOnlyGuard();

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
							<div className={`fr-modal__content ${styles.content}`}>
								<h2
									className={`fr-modal__title ${styles.title}`}
									id="update-cse-modal-title"
								>
									Mettre à jour la présence d&apos;un CSE
								</h2>
								<fieldset className={styles.toggleFieldset}>
									<legend
										className={`fr-text--regular fr-text--lg ${styles.legend}`}
									>
										Un CSE a-t-il été mis en place&nbsp;?
									</legend>
									<div
										className={`fr-btns-group fr-btns-group--inline ${styles.toggleGroup}`}
									>
										<button
											aria-pressed={hasCse === true}
											className={`fr-btn ${hasCse === true ? "" : "fr-btn--tertiary"} ${styles.toggleBtn}`}
											onClick={() => setHasCse(true)}
											type="button"
										>
											Oui
										</button>
										<button
											aria-pressed={hasCse === false}
											className={`fr-btn ${hasCse === false ? "" : "fr-btn--tertiary"} ${styles.toggleBtn}`}
											onClick={() => setHasCse(false)}
											type="button"
										>
											Non
										</button>
									</div>
								</fieldset>
							</div>
							<div className={`fr-modal__footer ${styles.footer}`}>
								<ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg">
									<li>
										<span>
											<button
												{...readOnlyGuard.buttonProps}
												className="fr-btn"
												disabled={
													hasCse === null ||
													mutation.isPending ||
													readOnlyGuard.isReadOnly
												}
												onClick={handleSave}
												type="button"
											>
												{mutation.isPending ? "Enregistrement…" : "Enregistrer"}
											</button>
											{readOnlyGuard.tooltip}
										</span>
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
