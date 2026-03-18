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
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploadError, setUploadError] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);

	function handleFileChange(file: File | null, error: string | null) {
		setSelectedFile(file);
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
		if (!selectedFile) {
			setUploadError("Veuillez sélectionner un fichier avant de soumettre.");
			return;
		}
		setUploadError(null);
		openModal();
	}

	async function handleConfirm() {
		closeModal();
		if (!selectedFile) return;

		setIsUploading(true);
		try {
			const result = await uploadFile(selectedFile);
			if (!result.ok) {
				setUploadError(result.error);
				setIsUploading(false);
				return;
			}
			saveMutation.mutate({
				fileName: selectedFile.name,
				filePath: result.key,
			});
		} catch {
			setIsUploading(false);
		}
	}

	return {
		closeModal,
		handleConfirm,
		handleFileChange,
		handleSubmit,
		isPending: isUploading || saveMutation.isPending,
		modalRef,
		selectedFile,
		uploadError,
	};
}
