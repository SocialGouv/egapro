"use client";

import { useCallback, useRef, useState } from "react";

import { getDsfrModal } from "./getDsfrModal";

type Options = {
	onConfirm: () => void;
};

export function usePdfUploadForm({ onConfirm }: Options) {
	const modalRef = useRef<HTMLDialogElement>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploadError, setUploadError] = useState<string | null>(null);

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

	function handleConfirm() {
		closeModal();
		onConfirm();
	}

	return {
		closeModal,
		handleConfirm,
		handleFileChange,
		handleSubmit,
		modalRef,
		selectedFile,
		uploadError,
	};
}
