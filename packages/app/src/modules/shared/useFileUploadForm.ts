"use client";

import { useCallback, useRef, useState } from "react";

import { getDsfrModal } from "./getDsfrModal";
import { uploadFile } from "./uploadFile";

type SaveMutation = {
	mutate: (input: { fileName: string; filePath: string }) => void;
	isPending: boolean;
};

type Options = {
	saveMutation: SaveMutation;
};

export function useFileUploadForm({ saveMutation }: Options) {
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
				const result = await uploadFile(file);
				if (!result.ok) {
					setUploadError(result.error);
					setIsUploading(false);
					return;
				}
				saveMutation.mutate({
					fileName: file.name,
					filePath: result.key,
				});
			}
			setSelectedFiles([]);
			setIsUploading(false);
		} catch {
			setIsUploading(false);
		}
	}

	return {
		closeModal,
		handleConfirm,
		handleFilesChange,
		handleSubmit,
		isPending: isUploading || saveMutation.isPending,
		modalRef,
		selectedFiles,
		uploadError,
	};
}
