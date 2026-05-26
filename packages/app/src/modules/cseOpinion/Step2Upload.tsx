"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { useReadOnlyGuard } from "~/modules/auth";
import { NewTabNotice } from "~/modules/layout/shared/NewTabNotice";
import { FileUpload, getDsfrModal, useFileUploadForm } from "~/modules/shared";
import { api } from "~/trpc/react";

import { CseStepIndicator } from "./components/CseStepIndicator";
import { OpinionSummaryBox } from "./components/OpinionSummaryBox";
import { SubmitConfirmationModal } from "./components/SubmitConfirmationModal";
import formStyles from "./shared/formActions.module.scss";
import { MAX_CSE_FILES, type UploadedFile } from "./types";

type Props = {
	declarationYear: number;
	hasSecondDeclaration?: boolean;
	existingFiles?: UploadedFile[];
};

export function Step2Upload({
	declarationYear,
	hasSecondDeclaration = true,
	existingFiles = [],
}: Props) {
	const router = useRouter();
	const utils = api.useUtils();
	const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
	const [finalizeError, setFinalizeError] = useState<string | null>(null);
	const readOnlyGuard = useReadOnlyGuard();

	const refreshFileList = useCallback(() => {
		void utils.cseOpinion.getFiles.invalidate();
		router.refresh();
	}, [utils, router]);

	const deleteMutation = api.cseOpinion.deleteFile.useMutation({
		onSuccess: () => {
			setDeletingFileId(null);
			refreshFileList();
		},
		onError: () => setDeletingFileId(null),
	});

	const finalizeMutation = api.cseOpinion.finalize.useMutation();

	const finalizeAndRedirect = useCallback(async () => {
		try {
			await finalizeMutation.mutateAsync();
			router.push("/avis-cse/confirmation");
		} catch (error) {
			setFinalizeError(
				error instanceof Error
					? error.message
					: "Erreur lors de la validation du dépôt.",
			);
		}
	}, [finalizeMutation, router]);

	const {
		closeModal,
		handleConfirm,
		handleFilesChange,
		handleSubmit,
		isPending,
		modalRef,
		selectedFiles,
		uploadError,
	} = useFileUploadForm({
		flowType: "cse_opinion",
		onUploaded: refreshFileList,
		onAllUploaded: () => {
			void finalizeAndRedirect();
		},
	});

	const skipUploadSubmit = useCallback(
		(event: React.FormEvent) => {
			event.preventDefault();
			setFinalizeError(null);
			const dialog = modalRef.current;
			if (!dialog) return;
			const modal = getDsfrModal(dialog);
			if (modal) {
				modal.disclose();
			} else {
				dialog.showModal();
			}
		},
		[modalRef],
	);

	const hasExistingFiles = existingFiles.length > 0;
	const hasSelectedFiles = selectedFiles.length > 0;
	const formSubmit =
		!hasSelectedFiles && hasExistingFiles ? skipUploadSubmit : handleSubmit;
	const confirmAction = hasSelectedFiles
		? handleConfirm
		: () => {
				closeModal();
				void finalizeAndRedirect();
			};

	const remainingSlots = MAX_CSE_FILES - existingFiles.length;
	const isSubmitting = isPending || finalizeMutation.isPending;

	return (
		<>
			<form autoComplete="off" onSubmit={formSubmit}>
				<div className="fr-grid-row fr-grid-row--middle fr-mb-3w">
					<div className="fr-col">
						<h1 className="fr-h4 fr-mb-0">
							Transmettre l&apos;avis ou les avis du CSE
						</h1>
					</div>
				</div>

				<CseStepIndicator currentStep={2} />

				<div>
					<label className="fr-label" htmlFor="cse-file-upload">
						Veuillez importer l&apos;ensemble des avis de votre CSE
						<span className="fr-hint-text">
							Taille maximale : 10 Mo par fichier. Format supporté : pdf.
							{existingFiles.length > 0 &&
								` (${existingFiles.length}/${MAX_CSE_FILES} fichier${existingFiles.length > 1 ? "s" : ""})`}
						</span>
					</label>
				</div>

				{existingFiles.map((file) => (
					<ExistingFileCard
						file={file}
						isDeleting={deletingFileId === file.id}
						key={file.id}
						onDelete={(fileId) => {
							setDeletingFileId(fileId);
							deleteMutation.mutate({ fileId });
						}}
					/>
				))}

				<FileUpload
					accept=".pdf"
					acceptLabel="pdf"
					allowedMimeTypes={["application/pdf"]}
					disabled={readOnlyGuard.isReadOnly}
					error={uploadError}
					inputId="cse-file-upload"
					maxFiles={remainingSlots}
					onFilesChange={handleFilesChange}
					selectedFiles={selectedFiles}
				/>

				<div className="fr-mt-4w">
					<OpinionSummaryBox
						firstDeclTitle="Exactitude des données et des méthodes de calcul de la déclaration de l'ensemble des indicateurs"
						secondDeclGapTitle="Justification des écarts ≥ 5 % par des critères objectifs et non sexistes de l'indicateur de rémunération par catégorie de salariés"
						secondDeclTitle="Exactitude des données et des méthodes de calcul de la seconde déclaration de l'indicateur de rémunération par catégorie de salariés"
						showSecondDeclaration={hasSecondDeclaration}
					/>
				</div>

				{finalizeError && (
					<p className="fr-error-text fr-mt-2w" role="alert">
						{finalizeError}
					</p>
				)}

				<div className={`fr-mt-4w ${formStyles.actions}`}>
					<Link
						className="fr-btn fr-btn--tertiary fr-icon-arrow-left-line fr-btn--icon-left"
						href="/avis-cse/etape/1"
					>
						Précédent
					</Link>
					<span>
						<button
							{...readOnlyGuard.buttonProps}
							className="fr-btn fr-icon-arrow-right-line fr-btn--icon-right"
							disabled={isSubmitting || readOnlyGuard.isReadOnly}
							type="submit"
						>
							{isSubmitting ? "Envoi en cours\u2026" : "Soumettre"}
						</button>
						{readOnlyGuard.tooltip}
					</span>
				</div>
			</form>

			<SubmitConfirmationModal
				declarationYear={declarationYear}
				modalRef={modalRef}
				onClose={closeModal}
				onSubmit={confirmAction}
			/>
		</>
	);
}

type ExistingFileCardProps = {
	file: UploadedFile;
	isDeleting: boolean;
	onDelete: (fileId: string) => void;
};

function ExistingFileCard({
	file,
	isDeleting,
	onDelete,
}: ExistingFileCardProps) {
	const readOnlyGuard = useReadOnlyGuard();
	return (
		<div className="fr-card fr-card--no-border fr-p-3w fr-mb-2w">
			<p className="fr-text--md fr-mb-0">{file.fileName}</p>
			<p className="fr-text--xs fr-text--mention-grey fr-mb-1w">
				PDF — Importé le {new Date(file.uploadedAt).toLocaleDateString("fr-FR")}
			</p>
			<div>
				<p className="fr-message fr-message--valid fr-mb-0">Fichier transmis</p>
				<div className="fr-mt-1w">
					<a
						className="fr-btn fr-btn--tertiary fr-btn--sm fr-icon-eye-line"
						href={`/api/v1/files/${file.id}`}
						rel="noopener noreferrer"
						target="_blank"
						title={`Visualiser ${file.fileName}`}
					>
						Visualiser
						<NewTabNotice />
					</a>
					<span>
						<button
							{...readOnlyGuard.buttonProps}
							className="fr-btn fr-btn--tertiary fr-btn--sm fr-icon-delete-line fr-ml-1w"
							disabled={isDeleting || readOnlyGuard.isReadOnly}
							onClick={() => onDelete(file.id)}
							title={`Supprimer ${file.fileName}`}
							type="button"
						>
							{isDeleting ? "Suppression\u2026" : "Supprimer"}
						</button>
						{readOnlyGuard.tooltip}
					</span>
				</div>
			</div>
		</div>
	);
}
