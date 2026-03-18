"use client";

import { useCallback, useRef, useState } from "react";

import styles from "./FileUpload.module.scss";
import { MAX_FILE_SIZE } from "./uploadConfig";

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
	selectedFile: File | null;
	error: string | null;
	onFileChange: (file: File | null, error: string | null) => void;
	/** Comma-separated list of accepted file extensions (e.g. ".pdf,.docx,.jpg"). */
	accept: string;
	/** Comma-separated list of accepted MIME types for validation (e.g. "application/pdf,image/jpeg"). */
	allowedMimeTypes: string[];
	/** Human-readable hint displayed under the label (e.g. "pdf, docx, jpg"). */
	acceptLabel: string;
};

export function FileUpload({
	inputId,
	selectedFile,
	error,
	onFileChange,
	accept,
	allowedMimeTypes,
	acceptLabel,
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
				return "Le fichier dépasse la taille maximale autorisée de 10 Mo.";
			}
			return null;
		},
		[allowedMimeTypes, acceptLabel],
	);

	const processFile = useCallback(
		(file: File) => {
			const validationError = validateFile(file);
			if (validationError) {
				onFileChange(null, validationError);
			} else {
				onFileChange(file, null);
			}
		},
		[onFileChange, validateFile],
	);

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		processFile(file);
	}

	function handleDrop(e: React.DragEvent) {
		e.preventDefault();
		setIsDragging(false);
		const file = e.dataTransfer.files[0];
		if (!file) return;
		processFile(file);
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

	function handleRemove() {
		onFileChange(null, null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	}

	const messagesId = `${inputId}-messages`;

	return (
		<div>
			{selectedFile && !error ? (
				<div className={styles.fileCard}>
					<p className="fr-text--md fr-mb-0">{selectedFile.name}</p>
					<p className="fr-text--xs fr-text--mention-grey fr-mb-1w">
						{getExtensionLabel(selectedFile.name)} –{" "}
						{formatFileSize(selectedFile.size)}
					</p>
					<div className={styles.fileCardFooter}>
						<p className="fr-message fr-message--valid fr-mb-0">
							Importation réussie
						</p>
						<button
							className="fr-btn fr-btn--tertiary fr-btn--sm fr-icon-delete-line"
							onClick={handleRemove}
							title="Supprimer le fichier"
							type="button"
						>
							Supprimer
						</button>
					</div>
				</div>
			) : (
				<section
					aria-label="Zone de dépôt de fichier"
					className={[
						styles.dropzone,
						isDragging && styles.dropzoneDragging,
						error && styles.dropzoneError,
					]
						.filter(Boolean)
						.join(" ")}
					onDragEnter={handleDragEnter}
					onDragLeave={handleDragLeave}
					onDragOver={handleDragOver}
					onDrop={handleDrop}
					ref={dropzoneRef}
				>
					<span aria-hidden="true" className="fr-icon-file-add-fill" />
					<span>
						<button
							className={styles.selectButton}
							onClick={() => fileInputRef.current?.click()}
							type="button"
						>
							Sélectionner un fichier
							<span
								aria-hidden="true"
								className="fr-icon-upload-line fr-icon--sm"
							/>
						</button>
					</span>
					<p className="fr-text--sm fr-mb-0">ou glisser-le ici</p>
				</section>
			)}

			<input
				accept={accept}
				aria-describedby={messagesId}
				aria-invalid={error !== null}
				className="fr-sr-only"
				id={inputId}
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
