"use client";

import { useCallback, useRef, useState } from "react";
import { getDsfrModal } from "./getDsfrModal";
import type { FlowType } from "./uploadConfig";
import { type UploadFailureReason, uploadFile } from "./uploadFile";

type Options = {
	flowType: FlowType;
	onUploaded?: (file: { fileId: string; fileName: string }) => void;
	onAllUploaded?: () => void;
};

export function useFileUploadForm({
	flowType,
	onUploaded,
	onAllUploaded,
}: Options) {
	const modalRef = useRef<HTMLDialogElement>(null);
	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);

	function handleFilesChange(files: File[], error: string | null) {
		setSelectedFiles(files);
		setUploadError(error);
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
		if (selectedFiles.length === 0) {
			setUploadError(
				"Veuillez sélectionner au moins un fichier avant de soumettre.",
			);
			return;
		}
		setUploadError(null);
		openModal();
	}

	async function handleConfirm() {
		closeModal();
		if (selectedFiles.length === 0) return;

		setIsUploading(true);
		try {
			for (const file of selectedFiles) {
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
			setSelectedFiles([]);
			setIsUploading(false);
			onAllUploaded?.();
		} catch {
			setUploadError("Erreur lors de l'upload du fichier");
			setIsUploading(false);
		}
	}

	return {
		closeModal,
		handleConfirm,
		handleFilesChange,
		handleSubmit,
		isPending: isUploading,
		modalRef,
		selectedFiles,
		uploadError,
	};
}

/**
 * Map the server's failure reason to the French copy shown to the user.
 * Falls back to the server-provided `error` string when the reason is
 * unknown — this keeps the UX informative even if the server adds a new
 * reason the client hasn't been updated for.
 */
function formatUploadError(
	reason: UploadFailureReason,
	serverError: string,
	virusName: string | undefined,
): string {
	switch (reason) {
		case "virus":
			return virusName
				? `Fichier rejeté par l'antivirus (signature : ${virusName}).`
				: "Fichier rejeté par l'antivirus.";
		case "scan_unavailable":
			return "Le service de scan antivirus est temporairement indisponible. Merci de réessayer dans quelques minutes.";
		case "max_files":
			return serverError;
		case "unauthorized":
			return "Non authentifié. Merci de vous reconnecter.";
		case "not_found":
			return "Déclaration introuvable pour l'année en cours.";
		case "too_large":
		case "wrong_type":
		case "empty":
		case "missing_flow":
		case "missing_filename":
			return serverError;
		case "server_error":
			return "Erreur lors de l'upload du fichier. Merci de réessayer.";
		case "aborted":
			return "L'upload a été interrompu. Merci de réessayer.";
	}
}
