"use client";

import { FileDownloadLink, useDsfrModal } from "~/modules/shared";
import styles from "./DownloadDataModal.module.scss";

const MODAL_ID = "consultation-download-modal";

type Props = {
	/** Export URL already carrying the criteria applied to the result list. */
	declarationsHref: string;
};

export function DownloadDataModal({ declarationsHref }: Props) {
	const { modalRef, open, close } = useDsfrModal();

	return (
		<>
			<button
				aria-controls={MODAL_ID}
				className="fr-btn fr-btn--tertiary fr-icon-download-line fr-btn--icon-left"
				onClick={open}
				type="button"
			>
				Télécharger les données
			</button>
			<dialog
				aria-labelledby={`${MODAL_ID}-title`}
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
										onClick={close}
										title="Fermer"
										type="button"
									>
										Fermer
									</button>
								</div>
								<div className="fr-modal__content">
									<h2 className="fr-modal__title" id={`${MODAL_ID}-title`}>
										Télécharger les données
									</h2>
									<p>
										Téléchargez les données correspondant à votre recherche, au
										format CSV.
									</p>
									<div className={styles.links}>
										<div>
											<FileDownloadLink
												className="fr-link fr-icon-download-line fr-link--icon-right"
												href={declarationsHref}
											>
												Écarts de rémunération
											</FileDownloadLink>
											<p className={styles.format}>CSV</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</dialog>
		</>
	);
}
