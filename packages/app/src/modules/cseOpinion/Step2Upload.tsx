"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { FileUpload, useFileUploadForm } from "~/modules/shared";
import { api } from "~/trpc/react";

import { CseStepIndicator } from "./components/CseStepIndicator";
import { OpinionSummaryBox } from "./components/OpinionSummaryBox";
import { SubmitConfirmationModal } from "./components/SubmitConfirmationModal";
import formStyles from "./shared/formActions.module.scss";
import { MAX_CSE_FILES, type UploadedFile } from "./types";

type Props = {
	hasSecondDeclaration?: boolean;
	existingFiles?: UploadedFile[];
};

export function Step2Upload({
	hasSecondDeclaration = true,
	existingFiles = [],
}: Props) {
	const router = useRouter();
	const utils = api.useUtils();
	const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

	const refreshFileList = useCallback(() => {
		void utils.cseOpinion.getFiles.invalidate();
		router.refresh();
	}, [utils, router]);

	const saveMutation = api.cseOpinion.uploadFile.useMutation({
		onSuccess: refreshFileList,
	});

	const deleteMutation = api.cseOpinion.deleteFile.useMutation({
		onSuccess: () => {
			setDeletingFileId(null);
			refreshFileList();
		},
		onError: () => setDeletingFileId(null),
	});

	const {
		closeModal,
		handleConfirm,
		handleFileChange,
		handleSubmit,
		isPending,
		modalRef,
		selectedFile,
		uploadError,
	} = useFileUploadForm({ saveMutation });

	const hasFiles = existingFiles.length > 0;
	const canAddMore = existingFiles.length < MAX_CSE_FILES;

	return (
		<>
			<form onSubmit={handleSubmit}>
				<div className="fr-grid-row fr-grid-row--middle fr-mb-3w">
					<div className="fr-col">
						<h1 className="fr-h4 fr-mb-0">
							Transmettre l&apos;avis ou les avis du CSE
						</h1>
					</div>
				</div>

				<CseStepIndicator currentStep={2} />

				{canAddMore ? (
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
				) : (
					<p className="fr-label">
						Veuillez importer l&apos;ensemble des avis de votre CSE
						<span className="fr-hint-text">
							{` (${existingFiles.length}/${MAX_CSE_FILES} fichiers)`}
						</span>
					</p>
				)}

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

				{canAddMore && (
					<FileUpload
						accept=".pdf"
						acceptLabel="pdf"
						allowedMimeTypes={["application/pdf"]}
						error={uploadError}
						inputId="cse-file-upload"
						onFileChange={handleFileChange}
						selectedFile={selectedFile}
					/>
				)}

				{!canAddMore && (
					<p
						aria-live="polite"
						className="fr-text--sm fr-text--mention-grey fr-mt-2w"
						role="status"
					>
						Nombre maximum de fichiers atteint ({MAX_CSE_FILES}).
					</p>
				)}

				<div className="fr-mt-4w">
					<OpinionSummaryBox
						firstDeclTitle="Exactitude des données et des méthodes de calcul de la déclaration de l'ensemble des indicateurs"
						secondDeclGapTitle="Justification des écarts ≥ 5 % par des critères objectifs et non sexistes de l'indicateur de rémunération par catégorie de salariés"
						secondDeclTitle="Exactitude des données et des méthodes de calcul de la seconde déclaration de l'indicateur de rémunération par catégorie de salariés"
						showSecondDeclaration={hasSecondDeclaration}
					/>
				</div>

				<div className={`fr-mt-4w ${formStyles.actions}`}>
					<Link
						className="fr-btn fr-btn--tertiary fr-icon-arrow-left-line fr-btn--icon-left"
						href="/avis-cse/etape/1"
					>
						Précédent
					</Link>
					{canAddMore && (
						<button
							className="fr-btn fr-icon-upload-line fr-btn--icon-left"
							disabled={isPending}
							type="submit"
						>
							{isPending ? "Envoi en cours…" : "Ajouter le fichier"}
						</button>
					)}
					{hasFiles && (
						<Link
							className="fr-btn fr-icon-arrow-right-line fr-btn--icon-right"
							href="/avis-cse/confirmation"
						>
							Suivant
						</Link>
					)}
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
	return (
		<div className="fr-card fr-card--no-border fr-p-3w fr-mb-2w">
			<p className="fr-text--md fr-mb-0">{file.fileName}</p>
			<p className="fr-text--xs fr-text--mention-grey fr-mb-1w">
				PDF — Importé le {new Date(file.uploadedAt).toLocaleDateString("fr-FR")}
			</p>
			<div>
				<p className="fr-message fr-message--valid fr-mb-0">Fichier transmis</p>
				<button
					className="fr-btn fr-btn--tertiary fr-btn--sm fr-icon-delete-line fr-mt-1w"
					disabled={isDeleting}
					onClick={() => onDelete(file.id)}
					title={`Supprimer ${file.fileName}`}
					type="button"
				>
					{isDeleting ? "Suppression…" : "Supprimer"}
				</button>
			</div>
		</div>
	);
}
