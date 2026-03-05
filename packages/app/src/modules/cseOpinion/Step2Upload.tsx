"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import { CseStepIndicator } from "./components/CseStepIndicator";
import { OpinionSummaryBox } from "./components/OpinionSummaryBox";
import { SubmitConfirmationModal } from "./components/SubmitConfirmationModal";
import uploadStyles from "./Step2Upload.module.scss";
import formStyles from "./shared/formActions.module.scss";

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

type DsfrModalApi = { disclose: () => void; conceal: () => void };

function getDsfrModal(element: HTMLElement): DsfrModalApi | null {
	if (!("dsfr" in window)) return null;
	return (
		window as unknown as {
			dsfr: (el: HTMLElement) => { modal: DsfrModalApi };
		}
	).dsfr(element).modal;
}

export function Step2Upload() {
	const router = useRouter();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const dropzoneRef = useRef<HTMLElement>(null);
	const modalRef = useRef<HTMLDialogElement>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [isDragging, setIsDragging] = useState(false);

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

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		if (!selectedFile) {
			setUploadError("Veuillez sélectionner un fichier avant de soumettre.");
			fileInputRef.current?.focus();
			return;
		}

		setUploadError(null);
		openModal();
	}

	function handleConfirm() {
		closeModal();
		// TODO: call tRPC mutation to upload file when API is wired (server must validate magic bytes + size independently)
		router.push("/avis-cse/confirmation");
	}

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

				{selectedFile && !uploadError ? (
					<div className={uploadStyles.fileCard}>
						<p className="fr-text--md fr-mb-0">{selectedFile.name}</p>
						<p className="fr-text--xs fr-text--mention-grey fr-mb-1w">
							PDF – {formatFileSize(selectedFile.size)}
						</p>
						<div className={uploadStyles.fileCardFooter}>
							<p className="fr-message fr-message--valid fr-mb-0">
								Importation réussie
							</p>
							<button
								className="fr-btn fr-btn--tertiary fr-btn--sm fr-icon-delete-line"
								onClick={() => {
									setSelectedFile(null);
									if (fileInputRef.current) {
										fileInputRef.current.value = "";
									}
								}}
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
						type="submit"
					>
						Soumettre
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
