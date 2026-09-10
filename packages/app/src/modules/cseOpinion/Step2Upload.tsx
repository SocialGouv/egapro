"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";

import { useReadOnlyGuard } from "~/modules/auth";
import { useDeclarationDraft } from "~/modules/declaration-remuneration/shared/draft/useDeclarationDraft";
import { useLockContext } from "~/modules/declaration-remuneration/shared/lock/LockContext";
import { CSE_OPINION_CONFIRMATION, cseOpinionStepHref } from "~/modules/routes";
import { FileUpload, getDsfrModal, useFileUploadForm } from "~/modules/shared";
import { api } from "~/trpc/react";
import { ContentTypeMatrix } from "./components/ContentTypeMatrix";
import { CseStepIndicator } from "./components/CseStepIndicator";
import { OpinionSummaryBox } from "./components/OpinionSummaryBox";
import { SubmitConfirmationModal } from "./components/SubmitConfirmationModal";
import {
	buildAssociationMap,
	clearFileAssociations,
	getMissingColumns,
	getUnassociatedFiles,
	toAssociationPayload,
} from "./contentTypeColumns";
import formStyles from "./shared/formActions.module.scss";
import {
	type AssociationMap,
	type ContentTypeColumn,
	MAX_CSE_FILES,
	type StoredFileContentType,
	type UploadedFile,
} from "./types";

type Props = {
	declarationYear: number;
	siren: string;
	existingFiles?: UploadedFile[];
	columns: ContentTypeColumn[];
	initialAssociations?: StoredFileContentType[];
};

export function Step2Upload({
	declarationYear,
	siren,
	existingFiles = [],
	columns,
	initialAssociations = [],
}: Props) {
	const router = useRouter();
	const utils = api.useUtils();
	const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
	const [finalizeError, setFinalizeError] = useState<string | null>(null);
	const [associationError, setAssociationError] = useState<string | null>(null);
	const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
	const [associations, setAssociations] = useState<AssociationMap>(() =>
		buildAssociationMap(columns, initialAssociations),
	);
	const readOnlyGuard = useReadOnlyGuard();
	const { isReadOnly } = useLockContext();

	const emptyDbValues = useMemo(() => ({}), []);
	useDeclarationDraft({
		siren,
		year: declarationYear,
		step: "upload",
		kind: "cse",
		dbValues: emptyDbValues,
	});

	const refreshFileList = useCallback(() => {
		void utils.cseOpinion.getFiles.invalidate();
		void utils.cseOpinion.getFileContentTypes.invalidate();
		router.refresh();
	}, [utils, router]);

	// The server is the source of truth for which associations actually
	// persisted. `associations` is written optimistically on every toggle, so
	// on a failed setFileContentTypes it must roll back to the last state the
	// server actually confirmed — not to whatever was locally displayed, which
	// may itself be the failed, never-committed value (#4102).
	//
	// The confirmed map is rebuilt from each call's own `variables` (tRPC's
	// second onSuccess/onError argument), never from a ref shared across
	// concurrent mutate() calls: two toggles in flight would otherwise let the
	// later-started call's ref write clobber the earlier one's, regardless of
	// which one actually resolved last (#4102).
	const lastConfirmedAssociations = useRef<AssociationMap>(
		buildAssociationMap(columns, initialAssociations),
	);

	const setTypesMutation = api.cseOpinion.setFileContentTypes.useMutation({
		onError: () => {
			setAssociations(lastConfirmedAssociations.current);
			setAssociationError(
				"Une erreur est survenue lors de l'enregistrement. Veuillez réessayer.",
			);
		},
		onSuccess: (_data, variables) => {
			lastConfirmedAssociations.current = buildAssociationMap(
				columns,
				variables.associations,
			);
			setAssociationError(null);
		},
	});

	const handleToggle = useCallback(
		(columnId: string, fileId: string, checked: boolean) => {
			const next: AssociationMap = {
				...associations,
				[columnId]: checked ? fileId : null,
			};
			setAssociations(next);
			setTypesMutation.mutate({
				associations: toAssociationPayload(columns, next),
			});
		},
		[associations, columns, setTypesMutation],
	);

	const deleteMutation = api.cseOpinion.deleteFile.useMutation({
		onSuccess: (_data, variables) => {
			setDeletingFileId(null);
			setAssociations((prev) => {
				const next = clearFileAssociations(prev, variables.fileId);
				// Deletion cascades server-side too, so the cleared map is itself
				// now the confirmed truth — keep it in sync for the next revert.
				lastConfirmedAssociations.current = next;
				return next;
			});
			refreshFileList();
		},
		onError: () => setDeletingFileId(null),
	});

	const finalizeMutation = api.cseOpinion.finalize.useMutation();

	const finalizeAndRedirect = useCallback(async () => {
		try {
			await finalizeMutation.mutateAsync();
			router.push(CSE_OPINION_CONFIRMATION);
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
		handleFilesChange,
		isPending: isUploadingFiles,
		modalRef,
		selectedFiles,
		uploadError,
	} = useFileUploadForm({
		flowType: "cse_opinion",
		onAllUploaded: refreshFileList,
		autoUpload: true,
	});

	const missingColumns = useMemo(
		() => getMissingColumns(columns, associations),
		[columns, associations],
	);

	const unassociatedFiles = useMemo(
		() => getUnassociatedFiles(existingFiles, associations),
		[existingFiles, associations],
	);

	const hasExistingFiles = existingFiles.length > 0;
	const isComplete = missingColumns.length === 0;
	const hasUnassociatedFiles = unassociatedFiles.length > 0;
	const canSubmit = isComplete && !hasUnassociatedFiles;
	// The validation errors are revealed only once the user has tried to submit
	// (besoin epic-3476): loading files must never trigger them on their own.
	const showMissingError = hasAttemptedSubmit && !isComplete;
	const showUnassociatedError = hasAttemptedSubmit && hasUnassociatedFiles;

	const openFinalizeModal = useCallback(() => {
		const dialog = modalRef.current;
		if (!dialog) return;
		const modal = getDsfrModal(dialog);
		if (modal) {
			modal.disclose();
		} else {
			dialog.showModal();
		}
	}, [modalRef]);

	const handleFormSubmit = useCallback(
		(event: React.FormEvent) => {
			event.preventDefault();
			setFinalizeError(null);
			if (!canSubmit) {
				setHasAttemptedSubmit(true);
				return;
			}
			setHasAttemptedSubmit(false);
			// Guard against finalize AND against an association save still in
			// flight — canSubmit reflects the optimistic matrix state, so without
			// this a save that hasn't reached the server yet can race finalize
			// and lose (#4102).
			if (finalizeMutation.isPending || setTypesMutation.isPending) return;
			openFinalizeModal();
		},
		[
			canSubmit,
			finalizeMutation.isPending,
			setTypesMutation.isPending,
			openFinalizeModal,
		],
	);

	const confirmFinalize = useCallback(() => {
		closeModal();
		void finalizeAndRedirect();
	}, [closeModal, finalizeAndRedirect]);

	// One file per required content type at most: a parcours with two avis to
	// justify accepts two files, not the four of the absolute cap (#4299).
	const fileQuota = Math.min(MAX_CSE_FILES, columns.length);
	const remainingSlots = Math.max(0, fileQuota - existingFiles.length);

	return (
		<>
			<form autoComplete="off" onSubmit={handleFormSubmit}>
				<div className="fr-grid-row fr-grid-row--middle fr-mb-4w">
					<div className="fr-col">
						<h1 className="fr-h4 fr-mb-0">
							Transmettre l&apos;avis ou les avis du CSE
						</h1>
					</div>
				</div>

				<CseStepIndicator currentStep={2} />

				<div>
					<label className="fr-label" htmlFor="cse-file-upload">
						Veuillez joindre les avis émis par votre CSE et renseigner le type
						de document correspondant.
						<span className="fr-hint-text">
							Taille maximale : 10 Mo par fichier. Format supporté : pdf.
						</span>
					</label>
				</div>

				<div className="fr-mt-4w">
					<FileUpload
						accept=".pdf"
						acceptLabel="pdf"
						allowedMimeTypes={["application/pdf"]}
						disabled={isReadOnly || isUploadingFiles || isComplete}
						error={uploadError}
						inputId="cse-file-upload"
						maxFileCount={remainingSlots}
						onFilesChange={handleFilesChange}
						selectedFiles={selectedFiles}
					/>
				</div>

				<div aria-live="polite" className="fr-messages-group">
					{isUploadingFiles && (
						<p className="fr-message fr-message--info fr-mb-0">
							Import du ou des fichiers en cours…
						</p>
					)}
				</div>

				{hasExistingFiles && (
					<div className="fr-mt-4w">
						<ContentTypeMatrix
							associations={associations}
							columns={columns}
							deletingFileId={deletingFileId}
							disabled={isReadOnly}
							files={existingFiles}
							onDelete={(fileId) => {
								setDeletingFileId(fileId);
								deleteMutation.mutate({ fileId });
							}}
							onToggle={handleToggle}
						/>
					</div>
				)}

				<div aria-live="polite">
					{showMissingError && (
						<div className="fr-alert fr-alert--error fr-mt-4w">
							<h2 className="fr-alert__title">Un avis CSE est manquant</h2>
							{missingColumns.map((column) => (
								<p key={column.id}>{column.missingMessage}</p>
							))}
						</div>
					)}
					{showUnassociatedError && (
						<div className="fr-alert fr-alert--error fr-mt-4w">
							<h2 className="fr-alert__title">
								Chaque fichier doit être associé à au moins un type de contenu
							</h2>
							{unassociatedFiles.map((file) => (
								<p key={file.id}>
									Le fichier «&nbsp;{file.fileName}&nbsp;» n&apos;est associé à
									aucun type de contenu. Cochez au moins un type, ou supprimez
									le fichier.
								</p>
							))}
						</div>
					)}
					{associationError && (
						<div className="fr-alert fr-alert--error fr-mt-4w">
							<p>{associationError}</p>
						</div>
					)}
				</div>

				<div className="fr-mt-4w">
					<OpinionSummaryBox associations={associations} columns={columns} />
				</div>

				{finalizeError && (
					<p className="fr-error-text fr-mt-2w" role="alert">
						{finalizeError}
					</p>
				)}

				<div className={`fr-mt-4w ${formStyles.actions}`}>
					<Link
						className="fr-btn fr-btn--tertiary fr-icon-arrow-left-line fr-btn--icon-left"
						href={cseOpinionStepHref(1)}
					>
						Précédent
					</Link>
					<span>
						<button
							{...readOnlyGuard.buttonProps}
							className="fr-btn fr-icon-arrow-right-line fr-btn--icon-right"
							disabled={isReadOnly}
							type="submit"
						>
							Soumettre
						</button>
						{readOnlyGuard.tooltip}
					</span>
				</div>
			</form>

			<SubmitConfirmationModal
				declarationYear={declarationYear}
				modalRef={modalRef}
				onClose={closeModal}
				onSubmit={confirmFinalize}
			/>
		</>
	);
}
