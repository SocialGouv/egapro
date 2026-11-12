"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./FileUpload.module.scss";
import { isKnownExtension, validateFileName } from "./fileNameValidation";
import { getExtensionLabel, SelectedFilesTable } from "./SelectedFilesTable";
import { UploadAlert } from "./UploadAlert";
import { formatFileMeta, MAX_FILE_SIZE } from "./uploadConfig";
import { UPLOAD_ERROR, type UploadError } from "./uploadErrors";

type Props = {
	inputId: string;
	/**
	 * Id of the visible text that asks for this document (the field's `<label>` or the
	 * heading of its panel). It names the file input and describes the selection button,
	 * so the requested document stays identifiable when several uploads share a page.
	 */
	labelId: string;
	selectedFiles: File[];
	error: UploadError | null;
	onFilesChange: (files: File[], error: UploadError | null) => void;
	/** Clears the displayed error without touching the selected files. */
	onErrorDismiss: () => void;
	/** Comma-separated list of accepted file extensions (e.g. ".pdf,.docx,.jpg"). */
	accept: string;
	/** Comma-separated list of accepted MIME types for validation (e.g. "application/pdf,image/jpeg"). */
	allowedMimeTypes: string[];
	/** Human-readable hint displayed under the label (e.g. "pdf, docx, jpg"). */
	acceptLabel: string;
	/** Maximum number of files that can be selected. */
	maxFileCount?: number;
	/**
	 * When true, the dropzone, file input and selection button are all
	 * disabled. The same controls also lock on their own once `maxFileCount`
	 * is reached. Consumers can still render the component to preserve layout,
	 * but the user cannot add files (e.g. during admin impersonation).
	 */
	disabled?: boolean;
	fileList?: "cards" | "table";
};

export function FileUpload({
	inputId,
	labelId,
	selectedFiles,
	error,
	onFilesChange,
	onErrorDismiss,
	accept,
	allowedMimeTypes,
	acceptLabel,
	maxFileCount = 1,
	disabled = false,
	fileList = "cards",
}: Props) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const dropzoneRef = useRef<HTMLElement>(null);
	const selectButtonRef = useRef<HTMLButtonElement>(null);
	const [restoreFocus, setRestoreFocus] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const [objectUrls, setObjectUrls] = useState<string[]>([]);

	useEffect(() => {
		const urls = selectedFiles.map((file) => URL.createObjectURL(file));
		setObjectUrls(urls);
		return () => {
			urls.forEach((url) => {
				URL.revokeObjectURL(url);
			});
		};
	}, [selectedFiles]);

	const validateFile = useCallback(
		(file: File): UploadError | null => {
			const fileNameResult = validateFileName(file.name, file.type);
			if (!fileNameResult.ok) {
				const isUnsupportedFormat =
					fileNameResult.reason === "extension_mime_mismatch" &&
					!isKnownExtension(file.name) &&
					!allowedMimeTypes.includes(file.type);
				if (isUnsupportedFormat) {
					return UPLOAD_ERROR.format(acceptLabel);
				}
				return UPLOAD_ERROR.invalidFileName(fileNameResult.message);
			}
			if (!allowedMimeTypes.includes(file.type)) {
				return UPLOAD_ERROR.format(acceptLabel);
			}
			if (file.size > MAX_FILE_SIZE) {
				return UPLOAD_ERROR.tooLarge();
			}
			return null;
		},
		[allowedMimeTypes, acceptLabel],
	);

	const processFiles = useCallback(
		(newFiles: FileList | File[]) => {
			const filesToAdd = Array.from(newFiles);
			const remainingSlots = maxFileCount - selectedFiles.length;
			const capped = filesToAdd.slice(0, remainingSlots);

			const accepted: File[] = [];
			let firstError: UploadError | null = null;
			for (const file of capped) {
				const validationError = validateFile(file);
				if (validationError) {
					firstError ??= validationError;
					continue;
				}
				accepted.push(file);
			}

			onFilesChange([...selectedFiles, ...accepted], firstError);
		},
		[onFilesChange, validateFile, selectedFiles, maxFileCount],
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
		setRestoreFocus(true);
		const updated = selectedFiles.filter((_, i) => i !== index);
		onFilesChange(updated, null);
	}

	function handleErrorDismiss() {
		onErrorDismiss();
		selectButtonRef.current?.focus();
	}

	const messagesId = `${inputId}-messages`;
	const canAddMore = !disabled && selectedFiles.length < maxFileCount;

	useEffect(() => {
		if (!restoreFocus || !canAddMore) return;
		setRestoreFocus(false);
		selectButtonRef.current?.focus();
	}, [restoreFocus, canAddMore]);

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
				<div className={styles.dropzoneActions}>
					<span>
						<button
							aria-describedby={labelId}
							className={styles.selectButton}
							disabled={!canAddMore}
							onClick={() => fileInputRef.current?.click()}
							ref={selectButtonRef}
							type="button"
						>
							{maxFileCount === 1
								? "Sélectionner un fichier"
								: "Sélectionner des fichiers"}
							<span
								aria-hidden="true"
								className="fr-icon-upload-line fr-icon--sm"
							/>
						</button>
					</span>
					<p className="fr-mb-0">
						{maxFileCount === 1 ? "ou glisser-le ici" : "ou glisser-les ici"}
					</p>
				</div>
			</section>

			{fileList === "table" && selectedFiles.length > 0 && (
				<SelectedFilesTable
					disabled={disabled}
					files={selectedFiles}
					objectUrls={objectUrls}
					onRemove={handleRemove}
					title={maxFileCount === 1 ? "Fichier déposé" : "Fichiers déposés"}
				/>
			)}

			{fileList === "cards" &&
				selectedFiles.map((file, index) => (
					<div className={`${styles.fileCard} fr-mt-2w`} key={file.name}>
						<div className={styles.fileCardFooter}>
							<div className={styles.fileCardInfo}>
								<a
									aria-label={`Télécharger ${file.name}`}
									className="fr-link fr-icon-download-line fr-link--icon-right"
									download={file.name}
									href={objectUrls[index] ?? "#"}
								>
									{file.name}
								</a>
								<p className="fr-text--xs fr-text-mention--grey fr-mb-0">
									{formatFileMeta(getExtensionLabel(file.name), file.size)}
								</p>
							</div>
							<button
								aria-label={`Supprimer ${file.name}`}
								className="fr-btn fr-btn--tertiary fr-btn--sm fr-icon-delete-line"
								onClick={() => handleRemove(index)}
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
				aria-labelledby={labelId}
				className="fr-sr-only"
				disabled={!canAddMore}
				id={inputId}
				multiple={maxFileCount > 1}
				name={inputId}
				onChange={handleFileChange}
				ref={fileInputRef}
				tabIndex={-1}
				type="file"
			/>

			<div className={styles.alertSlot} id={messagesId}>
				{error && <UploadAlert error={error} onClose={handleErrorDismiss} />}
			</div>
		</div>
	);
}
