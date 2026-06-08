"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getDsfrModal } from "~/modules/shared";
import { type ImportError, parseImportFile } from "./categoryFileHandler";
import type { EmployeeCategory } from "./categorySerializer";

type Props = {
	onImport: (categories: EmployeeCategory[]) => void;
	disabled?: boolean;
};

export function CategoryImportExport({ onImport, disabled = false }: Props) {
	const baseId = useId();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [importErrors, setImportErrors] = useState<ImportError[]>([]);
	const [isImporting, setIsImporting] = useState(false);
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	const importModalId = `${baseId}-import-modal`;
	const importTitleId = `${baseId}-import-title`;
	const uploadId = `${baseId}-import-file`;
	const messagesId = `${baseId}-import-messages`;
	const hasErrors = importErrors.length > 0;

	async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;

		setImportErrors([]);
		setIsImporting(true);

		try {
			const result = await parseImportFile(file);
			if (result.ok) {
				onImport(result.categories);
				const modal = document.getElementById(importModalId);
				if (modal) {
					getDsfrModal(modal)?.conceal();
				}
			} else {
				setImportErrors(result.errors);
			}
		} finally {
			setIsImporting(false);
			if (fileInputRef.current) {
				fileInputRef.current.value = "";
			}
		}
	}

	return (
		<>
			<button
				aria-controls={importModalId}
				className="fr-btn fr-btn--secondary fr-icon-file-download-line fr-btn--icon-left"
				data-fr-opened="false"
				disabled={disabled}
				type="button"
			>
				Importer les données
			</button>

			{mounted &&
				createPortal(
					<dialog
						aria-labelledby={importTitleId}
						aria-modal="true"
						className="fr-modal"
						id={importModalId}
					>
						<div className="fr-container fr-container--fluid fr-container-md">
							<div className="fr-grid-row fr-grid-row--center">
								<div className="fr-col-12 fr-col-md-8 fr-col-lg-6">
									<div className="fr-modal__body">
										<div className="fr-modal__header">
											<button
												aria-controls={importModalId}
												className="fr-btn--close fr-btn"
												title="Fermer"
												type="button"
											>
												Fermer
											</button>
										</div>
										<div className="fr-modal__content">
											<h2 className="fr-modal__title" id={importTitleId}>
												Importer les données
											</h2>
											<p>
												Le fichier importé remplacera toutes les données du
												formulaire. Formats acceptés : .xlsx et .csv (séparateur
												point-virgule).
											</p>
											<div
												className={
													hasErrors
														? "fr-upload-group fr-upload-group--error"
														: "fr-upload-group"
												}
											>
												<label className="fr-label" htmlFor={uploadId}>
													Sélectionner un fichier
													<span className="fr-hint-text">
														Formats : .xlsx ou .csv
													</span>
												</label>
												<input
													accept=".xlsx,.csv"
													aria-describedby={messagesId}
													className="fr-upload"
													disabled={isImporting}
													id={uploadId}
													name="import-file"
													onChange={handleFileChange}
													ref={fileInputRef}
													type="file"
												/>
												<div
													aria-live="polite"
													className="fr-messages-group"
													id={messagesId}
												>
													{importErrors.map((error) => (
														<p
															className="fr-message fr-message--error"
															key={error.message}
														>
															{error.message}
														</p>
													))}
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</dialog>,
					document.body,
				)}
		</>
	);
}
