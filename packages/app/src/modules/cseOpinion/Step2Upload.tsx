"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";

import { CseStepIndicator } from "./components/CseStepIndicator";
import { OpinionSummaryBox } from "./components/OpinionSummaryBox";
import { SubmitConfirmationModal } from "./components/SubmitConfirmationModal";
import styles from "./shared/formActions.module.scss";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export function Step2Upload() {
	const router = useRouter();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const modalRef = useRef<HTMLDialogElement>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploadError, setUploadError] = useState<string | null>(null);

	function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;

		if (file.type !== "application/pdf") {
			setUploadError(
				"Format de fichier non supporté. Seul le format PDF est accepté.",
			);
			setSelectedFile(null);
			return;
		}

		if (file.size > MAX_FILE_SIZE_BYTES) {
			setUploadError(
				"Le fichier dépasse la taille maximale autorisée de 10 Mo.",
			);
			setSelectedFile(null);
			return;
		}

		setUploadError(null);
		setSelectedFile(file);
	}

	function openModal() {
		const dialog = modalRef.current;
		if (!dialog) return;
		if ("dsfr" in window) {
			(
				window as unknown as {
					dsfr: (el: HTMLElement) => {
						modal: { disclose: () => void };
					};
				}
			)
				.dsfr(dialog)
				.modal.disclose();
		} else {
			dialog.showModal();
		}
	}

	const closeModal = useCallback(() => {
		const dialog = modalRef.current;
		if (!dialog) return;
		if ("dsfr" in window) {
			(
				window as unknown as {
					dsfr: (el: HTMLElement) => {
						modal: { conceal: () => void };
					};
				}
			)
				.dsfr(dialog)
				.modal.conceal();
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

				<div
					className={`fr-upload-group ${uploadError ? "fr-upload-group--error" : ""}`}
				>
					<label className="fr-label" htmlFor="cse-file-upload">
						Ajouter un fichier
						<span className="fr-hint-text">
							Format supporté : pdf. Taille maximale : 10 Mo.
						</span>
					</label>
					<input
						accept=".pdf"
						aria-describedby="cse-file-upload-messages"
						aria-invalid={uploadError !== null}
						className="fr-upload"
						id="cse-file-upload"
						name="cse-file-upload"
						onChange={handleFileChange}
						ref={fileInputRef}
						type="file"
					/>
					<div
						aria-live="polite"
						className="fr-messages-group"
						id="cse-file-upload-messages"
					>
						{uploadError && (
							<p className="fr-message fr-message--error">{uploadError}</p>
						)}
						{selectedFile && !uploadError && (
							<p className="fr-message fr-message--info">
								Fichier sélectionné : {selectedFile.name}
							</p>
						)}
					</div>
				</div>

				<div className="fr-mt-4w">
					<OpinionSummaryBox
						firstDeclTitle="Exactitude des données et des méthodes de calcul de la déclaration de l'ensemble des indicateurs"
						secondDeclGapTitle="Justification des écarts ≥ 5 % par des critères objectifs et non sexistes de l'indicateur de rémunération par catégorie de salariés"
						secondDeclTitle="Exactitude des données et des méthodes de calcul de la seconde déclaration de l'indicateur de rémunération par catégorie de salariés"
					/>
				</div>

				<div className={`fr-mt-4w ${styles.actions}`}>
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
