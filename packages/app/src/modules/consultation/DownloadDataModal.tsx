"use client";

import { FileDownloadLink, useDsfrModal } from "~/modules/shared";
import styles from "./DownloadDataModal.module.scss";

const MODAL_ID = "consultation-download-modal";

type Props = {
	/** Export URLs already carrying the criteria applied to the result list. */
	declarationsHref: string;
	representationsHref: string;
};

const DOWNLOADS = [
	{ key: "declarations", label: "Écarts de rémunération" },
	{ key: "representations", label: "Représentation équilibrée" },
] as const;

export function DownloadDataModal({
	declarationsHref,
	representationsHref,
}: Props) {
	const { modalRef, open, close } = useDsfrModal();
	const hrefs: Record<(typeof DOWNLOADS)[number]["key"], string> = {
		declarations: declarationsHref,
		representations: representationsHref,
	};

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
									<p>Sélectionnez les données à télécharger, au format CSV.</p>
									<div className={styles.links}>
										{DOWNLOADS.map((download) => (
											<div key={download.key}>
												<FileDownloadLink
													className="fr-link fr-icon-download-line fr-link--icon-right"
													href={hrefs[download.key]}
												>
													{download.label}
												</FileDownloadLink>
												<p className={styles.format}>CSV</p>
											</div>
										))}
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
