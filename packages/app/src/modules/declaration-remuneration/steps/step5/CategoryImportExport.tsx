"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
	MATOMO_ACTION,
	MATOMO_EVENT_CATEGORY,
	trackEvent,
} from "~/modules/analytics";
import {
	EXTENSION_MIME_MAP,
	FileUpload,
	formatFileSize,
	getDsfrModal,
} from "~/modules/shared";
import styles from "./CategoryImportExport.module.scss";
import {
	generateTemplate,
	type ImportError,
	parseImportFile,
} from "./categoryFileHandler";
import {
	startCategoryModelTimer,
	trackCategoryImportDuration,
} from "./categoryModelTracking";
import type { EmployeeCategory } from "./categorySerializer";

const TEMPLATE_FILE_NAME = "modele-indicateur-g.csv";

const ALLOWED_MIME_TYPES = [
	...new Set([
		...(EXTENSION_MIME_MAP[".csv"] ?? []),
		...(EXTENSION_MIME_MAP[".xlsx"] ?? []),
	]),
];

type Props = {
	onImport: (categories: EmployeeCategory[]) => void;
	disabled?: boolean;
};

export function CategoryImportExport({ onImport, disabled = false }: Props) {
	const baseId = useId();
	const [importErrors, setImportErrors] = useState<ImportError[]>([]);
	const [isImporting, setIsImporting] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [fileError, setFileError] = useState<string | null>(null);
	useEffect(() => setMounted(true), []);

	const importPanelId = `${baseId}-import-panel`;
	const importTitleId = `${baseId}-import-title`;
	const uploadId = `${baseId}-import-file`;
	const messagesId = `${baseId}-import-messages`;

	const templateBlob = useMemo(() => generateTemplate(), []);

	function handleDownloadTemplate() {
		const url = URL.createObjectURL(templateBlob);
		const link = document.createElement("a");
		link.href = url;
		link.download = TEMPLATE_FILE_NAME;
		link.click();
		URL.revokeObjectURL(url);
		trackEvent({
			category: MATOMO_EVENT_CATEGORY.DOCUMENT,
			action: MATOMO_ACTION.CATEGORY_TEMPLATE_DOWNLOAD,
			name: "csv",
		});
		startCategoryModelTimer();
	}

	async function handleImportClick() {
		const file = selectedFiles[0];
		if (!file) return;

		setImportErrors([]);
		setIsImporting(true);

		try {
			const result = await parseImportFile(file);
			if (result.ok) {
				onImport(result.categories);
				trackEvent({
					category: MATOMO_EVENT_CATEGORY.DOCUMENT,
					action: MATOMO_ACTION.CATEGORY_IMPORT,
					value: result.categories.length,
				});
				trackCategoryImportDuration();
				const panel = document.getElementById(importPanelId);
				if (panel) {
					getDsfrModal(panel)?.conceal();
				}
				setSelectedFiles([]);
			} else {
				setImportErrors(result.errors);
				const firstError = result.errors[0];
				if (firstError) {
					trackEvent({
						category: MATOMO_EVENT_CATEGORY.DOCUMENT,
						action: MATOMO_ACTION.CATEGORY_IMPORT_FAILURE,
						name: firstError.type,
					});
				}
			}
		} finally {
			setIsImporting(false);
		}
	}

	return (
		<>
			<button
				aria-controls={importPanelId}
				className="fr-btn fr-btn--secondary fr-icon-file-download-line fr-btn--icon-left"
				data-fr-opened="false"
				disabled={disabled}
				onClick={() => startCategoryModelTimer()}
				type="button"
			>
				Importer les données
			</button>

			{mounted &&
				createPortal(
					<dialog
						aria-labelledby={importTitleId}
						aria-modal="true"
						className={`fr-modal ${styles.sidePanel}`}
						id={importPanelId}
					>
						<div className={styles.panelContainer}>
							<div className={styles.panelHeader}>
								<button
									aria-controls={importPanelId}
									className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-btn--icon-right fr-icon-close-line"
									title="Fermer"
									type="button"
								>
									Fermer
								</button>
							</div>
							<div className={styles.panelContent}>
								<div className={styles.panelBody}>
									<h2 className="fr-h5 fr-mb-0" id={importTitleId}>
										Importer vos données depuis un fichier
									</h2>

									<FileUpload
										accept=".xlsx,.csv"
										acceptLabel="xlsx, csv"
										allowedMimeTypes={ALLOWED_MIME_TYPES}
										disabled={isImporting}
										error={fileError}
										inputId={uploadId}
										maxFileCount={1}
										onFilesChange={(files, error) => {
											setSelectedFiles(files);
											setFileError(error);
										}}
										selectedFiles={selectedFiles}
									/>

									<p className="fr-mb-0">
										Téléchargez le fichier à remplir, complétez-le, puis
										redéposez-le ci-dessus pour importer les données.
									</p>

									<TemplateDownloadCard
										onDownload={handleDownloadTemplate}
										sizeBytes={templateBlob.size}
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

								<div className={styles.helpSection}>
									<hr className="fr-hr" />
									<p className="fr-text--lg fr-text--bold fr-mb-0">
										Pour vous aider
									</p>
									<Link className="fr-link" href="/aide">
										Centre d&apos;aide
									</Link>
								</div>
							</div>
							<div className={styles.footer}>
								<button
									aria-describedby={messagesId}
									className="fr-btn"
									disabled={!selectedFiles[0] || isImporting}
									onClick={handleImportClick}
									type="button"
								>
									Importer
								</button>
							</div>
						</div>
					</dialog>,
					document.body,
				)}
		</>
	);
}

function TemplateDownloadCard({
	sizeBytes,
	onDownload,
}: {
	sizeBytes: number;
	onDownload: () => void;
}) {
	return (
		<div className="fr-card fr-card--sm fr-card--download fr-enlarge-button">
			<div className="fr-card__body">
				<div className="fr-card__content">
					<h3 className="fr-card__title">
						<button onClick={onDownload} type="button">
							Fichier d&apos;import à remplir
						</button>
					</h3>
					<p className="fr-card__desc">
						Écart de rémunération par catégories de salariés
					</p>
					<div className="fr-card__end">
						<p className="fr-card__detail">CSV – {formatFileSize(sizeBytes)}</p>
					</div>
				</div>
			</div>
		</div>
	);
}
