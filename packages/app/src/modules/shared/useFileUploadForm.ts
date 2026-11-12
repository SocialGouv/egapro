"use client";

import { useCallback, useRef, useState } from "react";
import {
	MATOMO_ACTION,
	MATOMO_EVENT_CATEGORY,
	trackEvent,
} from "~/modules/analytics";
import { getDsfrModal } from "./getDsfrModal";
import type { FlowType } from "./uploadConfig";
import { UPLOAD_ERROR, type UploadError } from "./uploadErrors";
import { type UploadFailureReason, uploadFile } from "./uploadFile";

type Options = {
	flowType: FlowType;
	onUploaded?: (file: { fileId: string; fileName: string }) => void;
	onAllUploaded?: () => void;
	/**
	 * When true, files are uploaded as soon as they are selected — there is no
	 * staging step and no confirmation modal. `selectedFiles` then stays empty
	 * (uploaded files surface through the consumer's own listing, e.g. the CSE
	 * content-type matrix). Defaults to the staged flow (select → confirm modal
	 * → upload) used by the other upload forms.
	 */
	autoUpload?: boolean;
	hasStoredFile?: boolean;
};

export function useFileUploadForm({
	flowType,
	onUploaded,
	onAllUploaded,
	autoUpload = false,
	hasStoredFile = false,
}: Options) {
	const modalRef = useRef<HTMLDialogElement>(null);
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [uploadError, setUploadError] = useState<UploadError | null>(null);
	const [hasMissingFile, setHasMissingFile] = useState(false);
	const [isUploading, setIsUploading] = useState(false);

	const uploadFiles = useCallback(
		async (filesToUpload: File[]) => {
			if (filesToUpload.length === 0) return;
			setIsUploading(true);
			try {
				for (const file of filesToUpload) {
					const result = await uploadFile(file, { flowType });
					if (!result.ok) {
						setUploadError(
							formatUploadError(result.reason, result.error, result.virusName),
						);
						setIsUploading(false);
						return;
					}
					onUploaded?.({ fileId: result.fileId, fileName: result.fileName });
				}
				// `flowType` is a non-PII enum (e.g. the CSE opinion flow); the file
				// names themselves are never sent.
				trackEvent({
					category: MATOMO_EVENT_CATEGORY.DOCUMENT,
					action: MATOMO_ACTION.FILE_UPLOAD,
					name: flowType,
					value: filesToUpload.length,
				});
				setSelectedFiles([]);
				setIsUploading(false);
				onAllUploaded?.();
			} catch {
				setUploadError(UPLOAD_ERROR.network());
				setIsUploading(false);
			}
		},
		[flowType, onUploaded, onAllUploaded],
	);

	function handleFilesChange(files: File[], error: UploadError | null) {
		setHasMissingFile(false);
		if (error) {
			setSelectedFiles(files);
			setUploadError(error);
			return;
		}
		setUploadError(null);
		if (autoUpload) {
			void uploadFiles(files);
			return;
		}
		setSelectedFiles(files);
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

	const clearUploadError = useCallback(() => setUploadError(null), []);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (selectedFiles.length === 0 && !hasStoredFile) {
			// Kept out of `uploadError`, which stays the dropzone's per-file line.
			setHasMissingFile(true);
			return;
		}
		setHasMissingFile(false);
		setUploadError(null);
		openModal();
	}

	async function handleConfirm() {
		closeModal();
		if (selectedFiles.length === 0) {
			if (hasStoredFile) onAllUploaded?.();
			return;
		}
		await uploadFiles(selectedFiles);
	}

	return {
		clearUploadError,
		closeModal,
		handleConfirm,
		handleFilesChange,
		handleSubmit,
		hasMissingFile,
		isPending: isUploading,
		modalRef,
		selectedFiles,
		uploadError,
	};
}

/**
 * Map the server's failure reason to the alert shown to the user.
 * Falls back to the server-provided `error` string when the reason is
 * unknown — this keeps the UX informative even if the server adds a new
 * reason the client hasn't been updated for.
 */
function formatUploadError(
	reason: UploadFailureReason,
	serverError: string,
	virusName: string | undefined,
): UploadError {
	switch (reason) {
		case "virus":
			return UPLOAD_ERROR.virus(virusName);
		case "scan_unavailable":
			return UPLOAD_ERROR.scanUnavailable(serverError);
		case "max_files":
			return UPLOAD_ERROR.maxFiles(serverError);
		case "unauthorized":
			return UPLOAD_ERROR.unauthorized();
		case "not_found":
			return UPLOAD_ERROR.notFound();
		case "invalid_filename":
			return UPLOAD_ERROR.invalidFileName(serverError);
		case "too_large":
			return UPLOAD_ERROR.tooLarge();
		case "wrong_type":
			return UPLOAD_ERROR.formatRejected(serverError);
		case "empty":
			return UPLOAD_ERROR.empty(serverError);
		case "missing_flow":
		case "missing_filename":
			return UPLOAD_ERROR.invalidRequest(serverError);
		case "server_error":
			return UPLOAD_ERROR.server();
		case "aborted":
			return UPLOAD_ERROR.aborted();
	}
}
