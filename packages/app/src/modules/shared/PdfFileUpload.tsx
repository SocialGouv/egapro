"use client";

import { useCallback, useRef, useState } from "react";

import styles from "./PdfFileUpload.module.scss";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function validateFile(file: File): string | null {
	if (file.type !== "application/pdf") {
		return "Format de fichier non supporté. Seul le format PDF est accepté.";
	}
	if (file.size > MAX_FILE_SIZE_BYTES) {
		return "Le fichier dépasse la taille maximale autorisée de 10 Mo.";
	}
	return null;
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} o`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} Ko`;
	return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
}

type Props = {
	inputId: string;
	selectedFile: File | null;
	error: string | null;
	onFileChange: (file: File | null, error: string | null) => void;
};

export function PdfFileUpload({
	inputId,
	selectedFile,
	error,
	onFileChange,
}: Props) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const dropzoneRef = useRef<HTMLElement>(null);
	const [isDragging, setIsDragging] = useState(false);

	const processFile = useCallback(
		(file: File) => {
			const validationError = validateFile(file);
			if (validationError) {
				onFileChange(null, validationError);
			} else {
				onFileChange(file, null);
			}
		},
		[onFileChange],
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
						PDF – {formatFileSize(selectedFile.size)}
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

			<label className="fr-sr-only" htmlFor={inputId}>
				Sélectionner un fichier PDF
			</label>
			<input
				accept=".pdf"
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
