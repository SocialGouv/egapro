"use client";

import { useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getDsfrModal } from "~/modules/shared";
import {
	generateTemplate,
	type ImportError,
	parseImportFile,
} from "./categoryImportExport";
import type { EmployeeCategory } from "./categorySerializer";

type Props = {
	getCategories: () => EmployeeCategory[];
	onImport: (categories: EmployeeCategory[]) => void;
	siren?: string;
	year?: number;
};

export function CategoryImportExport({
	getCategories,
	onImport,
	siren,
	year,
}: Props) {
	const baseId = useId();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [importErrors, setImportErrors] = useState<ImportError[]>([]);
	const [isDownloading, setIsDownloading] = useState(false);
	const [isImporting, setIsImporting] = useState(false);
	const exportModalId = `${baseId}-export-modal`;
	const exportTitleId = `${baseId}-export-title`;
	const importModalId = `${baseId}-import-modal`;
	const importTitleId = `${baseId}-import-title`;
	const uploadId = `${baseId}-import-file`;
	const messagesId = `${baseId}-import-messages`;
	const hasErrors = importErrors.length > 0;

	async function handleDownload(format: "xlsx" | "csv") {
		setIsDownloading(true);
		try {
			const blob = await generateTemplate(getCategories(), format);
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			const parts = ["indicateur-g", siren, year].filter(Boolean).join("-");
			link.download = `${parts}.${format}`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		} finally {
			setIsDownloading(false);
		}
	}

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
			<ul className="fr-btns-group fr-btns-group--inline fr-btns-group--icon-left fr-btns-group--sm">
				<li>
					<button
						aria-controls={exportModalId}
						className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-icon-download-line fr-btn--icon-left"
						data-fr-opened="false"
						type="button"
					>
						Exporter le modèle
					</button>
				</li>
				<li>
					<button
						aria-controls={importModalId}
						className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-icon-upload-line fr-btn--icon-left"
						data-fr-opened="false"
						type="button"
					>
						Importer un fichier
					</button>
				</li>
			</ul>

			{createPortal(
				<>
					<dialog
						aria-labelledby={exportTitleId}
						className="fr-modal"
						id={exportModalId}
						role="dialog"
					>
						<div className="fr-container fr-container--fluid fr-container-md">
							<div className="fr-grid-row fr-grid-row--center">
								<div className="fr-col-12 fr-col-md-6 fr-col-lg-4">
									<div className="fr-modal__body">
										<div className="fr-modal__header">
											<button
												aria-controls={exportModalId}
												className="fr-btn--close fr-btn"
												title="Fermer"
												type="button"
											>
												Fermer
											</button>
										</div>
										<div className="fr-modal__content">
											<h2 className="fr-modal__title" id={exportTitleId}>
												Télécharger le modèle
											</h2>
											<p>
												Choisissez le format du fichier modèle. Il contiendra
												les catégories actuelles du formulaire.
											</p>
										</div>
										<div className="fr-modal__footer">
											<ul className="fr-btns-group fr-btns-group--inline fr-btns-group--right fr-btns-group--icon-left fr-btns-group--equisized">
												<li>
													<button
														className="fr-btn fr-btn--secondary fr-icon-download-line fr-btn--icon-left"
														disabled={isDownloading}
														onClick={() => handleDownload("xlsx")}
														type="button"
													>
														Format Excel (.xlsx)
													</button>
												</li>
												<li>
													<button
														className="fr-btn fr-btn--secondary fr-icon-download-line fr-btn--icon-left"
														disabled={isDownloading}
														onClick={() => handleDownload("csv")}
														type="button"
													>
														Format CSV (.csv)
													</button>
												</li>
											</ul>
										</div>
									</div>
								</div>
							</div>
						</div>
					</dialog>

					<dialog
						aria-labelledby={importTitleId}
						className="fr-modal"
						id={importModalId}
						role="dialog"
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
												Importer un fichier
											</h2>
											<p>
												Le fichier importé remplacera toutes les données du
												formulaire. Formats acceptés : .xlsx et .csv (séparateur
												point-virgule).
											</p>
											<div
												className={`fr-upload-group${hasErrors ? "fr-upload-group--error" : ""}`}
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
					</dialog>
				</>,
				document.body,
			)}
		</>
	);
}
