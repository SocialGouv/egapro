"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import { api } from "~/trpc/react";

import { CseStepIndicator } from "./components/CseStepIndicator";
import { OpinionSummaryBox } from "./components/OpinionSummaryBox";
import { PendingFileCard } from "./components/PendingFileCard";
import { SubmitConfirmationModal } from "./components/SubmitConfirmationModal";
import { UploadedFileCard } from "./components/UploadedFileCard";
import uploadStyles from "./Step2Upload.module.scss";
import formStyles from "./shared/formActions.module.scss";
import type { UploadedFile } from "./types";

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

type DsfrModalApi = { disclose: () => void; conceal: () => void };

function getDsfrModal(element: HTMLElement): DsfrModalApi | null {
	if (!("dsfr" in window)) return null;
	return (
		window as unknown as {
			dsfr: (el: HTMLElement) => { modal: DsfrModalApi };
		}
	).dsfr(element).modal;
}

async function uploadFileToApi(
	file: File,
): Promise<{ data?: UploadedFile; error?: string }> {
	const formData = new FormData();
	formData.append("file", file);

	const response = await fetch("/api/cse-opinion/upload", {
		method: "POST",
		body: formData,
	});

	if (!response.ok) {
		const body = (await response.json()) as { error: string };
		return { error: body.error };
	}

	const uploaded = (await response.json()) as UploadedFile;
	return { data: uploaded };
}

type Props = {
	existingFiles?: UploadedFile[];
};

export function Step2Upload({ existingFiles = [] }: Props) {
	const router = useRouter();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const dropzoneRef = useRef<HTMLElement>(null);
	const modalRef = useRef<HTMLDialogElement>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploadedFiles, setUploadedFiles] =
		useState<UploadedFile[]>(existingFiles);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [isUploading, setIsUploading] = useState(false);

	const submitFiles = api.cseOpinion.submitFiles.useMutation();
	const deleteFileMutation = api.cseOpinion.deleteFile.useMutation();

	function processFile(file: File) {
		const error = validateFile(file);
		if (error) {
			setUploadError(error);
			setSelectedFile(null);
			return;
		}
		setUploadError(null);
		setSelectedFile(file);
	}

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

	function openModal() {
		const dialog = modalRef.current;
		if (!dialog) return;
		const modal = getDsfrModal(dialog);
		if (modal) {
			modal.disclose();
		} else {
			dialog.showModal();
		}
	}

	const closeModal = useCallback(() => {
		const dialog = modalRef.current;
		if (!dialog) return;
		const modal = getDsfrModal(dialog);
		if (modal) {
			modal.conceal();
		} else {
			dialog.close();
		}
	}, []);

	function clearSelectedFile() {
		setSelectedFile(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	}

	async function handleUploadFile() {
		if (!selectedFile) return;

		setIsUploading(true);
		setUploadError(null);

		try {
			const result = await uploadFileToApi(selectedFile);
			if (result.error) {
				setUploadError(result.error);
				return;
			}
			const uploaded = result.data;
			if (uploaded) {
				setUploadedFiles((prev) => [...prev, uploaded]);
				clearSelectedFile();
			}
		} catch {
			setUploadError("Erreur lors de l'upload du fichier.");
		} finally {
			setIsUploading(false);
		}
	}

	async function handleDeleteFile(fileId: string) {
		try {
			await deleteFileMutation.mutateAsync({ fileId });
			setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
		} catch {
			setUploadError("Erreur lors de la suppression du fichier.");
		}
	}

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		if (uploadedFiles.length === 0 && !selectedFile) {
			setUploadError("Veuillez sélectionner un fichier avant de soumettre.");
			fileInputRef.current?.focus();
			return;
		}

		setUploadError(null);
		openModal();
	}

	async function handleConfirm() {
		closeModal();
		setIsUploading(true);

		try {
			let allFiles = uploadedFiles;

			// Upload pending file if any
			if (selectedFile) {
				const result = await uploadFileToApi(selectedFile);
				if (result.error) {
					setUploadError(result.error);
					setIsUploading(false);
					return;
				}
				const uploaded = result.data;
				if (uploaded) {
					allFiles = [...uploadedFiles, uploaded];
					setUploadedFiles(allFiles);
					clearSelectedFile();
				}
			}

			await submitFiles.mutateAsync({
				fileIds: allFiles.map((f) => f.id),
			});

			router.push("/avis-cse/confirmation");
		} catch {
			setUploadError("Erreur lors de la soumission.");
		} finally {
			setIsUploading(false);
		}
	}

	const hasFiles = uploadedFiles.length > 0 || selectedFile !== null;

	return (
		<>
			<form onSubmit={handleSubmit}>
				<div className="fr-grid-row fr-grid-row--middle fr-mb-3w">
					<div className="fr-col">
						<h1 className="fr-h4 fr-mb-0">
							Transmettre l'avis ou les avis du CSE
						</h1>
					</div>
				</div>

				<CseStepIndicator currentStep={2} />

				<div className="fr-mb-3w">
					<p className="fr-text--md fr-text--bold fr-mb-1w">
						Veuillez importer l'ensemble des avis de votre CSE
					</p>
					<p className="fr-text--sm fr-text--mention-grey fr-mb-0">
						Taille maximale : 10 Mo. Format supporté : pdf.
					</p>
				</div>

				{uploadedFiles.map((file) => (
					<UploadedFileCard
						disabled={isUploading}
						fileName={file.fileName}
						fileSize={file.fileSize}
						key={file.id}
						onDelete={() => handleDeleteFile(file.id)}
					/>
				))}

				{selectedFile && !uploadError ? (
					<PendingFileCard
						fileName={selectedFile.name}
						fileSize={selectedFile.size}
						isUploading={isUploading}
						onDelete={clearSelectedFile}
						onUpload={handleUploadFile}
					/>
				) : (
					<section
						aria-label="Zone de dépôt de fichier"
						className={[
							uploadStyles.dropzone,
							isDragging && uploadStyles.dropzoneDragging,
							uploadError && uploadStyles.dropzoneError,
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
								className={uploadStyles.selectButton}
								disabled={isUploading}
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

				<label className="fr-sr-only" htmlFor="cse-file-upload">
					Sélectionner un fichier PDF
				</label>
				<input
					accept=".pdf"
					aria-describedby="cse-file-upload-messages"
					aria-invalid={uploadError !== null}
					className="fr-sr-only"
					id="cse-file-upload"
					name="cse-file-upload"
					onChange={handleFileChange}
					ref={fileInputRef}
					tabIndex={-1}
					type="file"
				/>

				<div
					aria-live="polite"
					className="fr-messages-group fr-mt-1w"
					id="cse-file-upload-messages"
				>
					{uploadError && (
						<p className="fr-message fr-message--error">{uploadError}</p>
					)}
				</div>

				<div className="fr-mt-4w">
					<OpinionSummaryBox
						firstDeclTitle="Exactitude des données et des méthodes de calcul de la déclaration de l'ensemble des indicateurs"
						secondDeclGapTitle="Justification des écarts ≥ 5 % par des critères objectifs et non sexistes de l'indicateur de rémunération par catégorie de salariés"
						secondDeclTitle="Exactitude des données et des méthodes de calcul de la seconde déclaration de l'indicateur de rémunération par catégorie de salariés"
					/>
				</div>

				<div className={`fr-mt-4w ${formStyles.actions}`}>
					<Link
						className="fr-btn fr-btn--tertiary fr-icon-arrow-left-line fr-btn--icon-left"
						href="/avis-cse/etape/1"
					>
						Précédent
					</Link>
					<button
						className="fr-btn fr-icon-arrow-right-line fr-btn--icon-right"
						disabled={isUploading || !hasFiles}
						type="submit"
					>
						{isUploading ? "Envoi en cours…" : "Soumettre"}
					</button>
				</div>
			</form>

			<SubmitConfirmationModal
				modalRef={modalRef}
				onClose={closeModal}
				onSubmit={handleConfirm}
			/>
		</>
	);
}
