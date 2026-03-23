"use client";

import { useCallback, useRef, useState } from "react";

import styles from "./FileUpload.module.scss";
import { FILE_TOO_LARGE_ERROR, MAX_FILE_SIZE } from "./uploadConfig";

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} o`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} Ko`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
}

function getExtensionLabel(name: string): string {
	const ext = name.split(".").pop()?.toUpperCase();
	return ext ?? "Fichier";
}

type Props = {
	inputId: string;
	selectedFiles: File[];
	error: string | null;
	onFilesChange: (files: File[], error: string | null) => void;
	/** Comma-separated list of accepted file extensions (e.g. ".pdf,.docx,.jpg"). */
	accept: string;
	/** Comma-separated list of accepted MIME types for validation (e.g. "application/pdf,image/jpeg"). */
	allowedMimeTypes: string[];
	/** Human-readable hint displayed under the label (e.g. "pdf, docx, jpg"). */
	acceptLabel: string;
	/** Maximum number of files that can be selected. */
	maxFiles?: number;
};

export function FileUpload({
	inputId,
	selectedFiles,
	error,
	onFilesChange,
	accept,
	allowedMimeTypes,
	acceptLabel,
	maxFiles = 1,
}: Props) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const dropzoneRef = useRef<HTMLElement>(null);
	const [isDragging, setIsDragging] = useState(false);

	const validateFile = useCallback(
		(file: File): string | null => {
			if (!allowedMimeTypes.includes(file.type)) {
				return `Format de fichier non supporté. Formats acceptés : ${acceptLabel}.`;
			}
			if (file.size > MAX_FILE_SIZE) {
				return FILE_TOO_LARGE_ERROR;
			}
			return null;
		},
		[allowedMimeTypes, acceptLabel],
	);

	const processFiles = useCallback(
		(newFiles: FileList | File[]) => {
			const filesToAdd = Array.from(newFiles);
			const remainingSlots = maxFiles - selectedFiles.length;
			const capped = filesToAdd.slice(0, remainingSlots);

			for (const file of capped) {
				const validationError = validateFile(file);
				if (validationError) {
					onFilesChange(selectedFiles, validationError);
					return;
				}
			}
			onFilesChange([...selectedFiles, ...capped], null);
		},
		[onFilesChange, validateFile, selectedFiles, maxFiles],
	);

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const files = e.target.files;
		if (!files || files.length === 0) return;
		processFiles(files);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	}

	function handleDrop(e: React.DragEvent) {
		e.preventDefault();
		setIsDragging(false);
		const files = e.dataTransfer.files;
		if (!files || files.length === 0) return;
		processFiles(files);
	}

	function handleDragOver(e: React.DragEvent) {
		e.preventDefault();
	}

	function handleDragEnter(e: React.DragEvent) {
		e.preventDefault();
		setIsDragging(true);
	}

	function handleDragLeave(e: React.DragEvent) {
		if (dropzoneRef.current?.contains(e.relatedTarget as Node)) return;
		setIsDragging(false);
	}

	function handleRemove(index: number) {
		const updated = selectedFiles.filter((_, i) => i !== index);
		onFilesChange(updated, null);
	}

	const messagesId = `${inputId}-messages`;
	const canAddMore = selectedFiles.length < maxFiles;

	return (
		<div>
			<section
				aria-label="Zone de dépôt de fichier"
				className={[
					styles.dropzone,
					isDragging && canAddMore && styles.dropzoneDragging,
					error && styles.dropzoneError,
					!canAddMore && styles.dropzoneDisabled,
				]
					.filter(Boolean)
					.join(" ")}
				onDragEnter={canAddMore ? handleDragEnter : undefined}
				onDragLeave={canAddMore ? handleDragLeave : undefined}
				onDragOver={canAddMore ? handleDragOver : undefined}
				onDrop={canAddMore ? handleDrop : undefined}
				ref={dropzoneRef}
			>
				<span aria-hidden="true" className="fr-icon-file-add-fill" />
				<span>
					<button
						className={styles.selectButton}
						disabled={!canAddMore}
						onClick={() => fileInputRef.current?.click()}
						type="button"
					>
						Sélectionner des fichiers
						<span
							aria-hidden="true"
							className="fr-icon-upload-line fr-icon--sm"
						/>
					</button>
				</span>
				<p className="fr-text--sm fr-mb-0">ou glisser-les ici</p>
			</section>

			{selectedFiles.map((file, index) => (
				<div className={`${styles.fileCard} fr-mt-2w`} key={file.name}>
					<p className="fr-text--md fr-mb-0">{file.name}</p>
					<p className="fr-text--xs fr-text--mention-grey fr-mb-1w">
						{getExtensionLabel(file.name)} – {formatFileSize(file.size)}
					</p>
					<div className={styles.fileCardFooter}>
						<p className="fr-message fr-message--valid fr-mb-0">
							Importation réussie
						</p>
						<button
							className="fr-btn fr-btn--tertiary fr-btn--sm fr-icon-delete-line"
							onClick={() => handleRemove(index)}
							title={`Supprimer ${file.name}`}
							type="button"
						>
							Supprimer
						</button>
					</div>
				</div>
			))}

			<input
				accept={accept}
				aria-describedby={messagesId}
				aria-invalid={error !== null}
				className="fr-sr-only"
				id={inputId}
				multiple={maxFiles > 1}
				name={inputId}
				onChange={handleFileChange}
				ref={fileInputRef}
				tabIndex={-1}
				type="file"
			/>

			<div
				aria-live="polite"
				className="fr-messages-group fr-mt-1w"
				id={messagesId}
			>
				{error && <p className="fr-message fr-message--error">{error}</p>}
			</div>
		</div>
	);
}
