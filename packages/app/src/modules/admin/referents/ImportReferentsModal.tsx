"use client";

import { useCallback, useState } from "react";

import { useDsfrModal } from "~/modules/shared";
import { api } from "~/trpc/react";

import { importReferentsSchema } from "./schemas";

const MODAL_ID = "admin-import-referents-modal";

export function useImportModal() {
	return useDsfrModal();
}

type Props = {
	modalRef: React.RefObject<HTMLDialogElement | null>;
	onClose: () => void;
	onSuccess: () => void;
};

export function ImportReferentsModal({ modalRef, onClose, onSuccess }: Props) {
	const [file, setFile] = useState<File | null>(null);
	const [error, setError] = useState("");
	const importMutation = api.adminReferents.import.useMutation({
		onSuccess: () => {
			setFile(null);
			setError("");
			onClose();
			onSuccess();
		},
		onError: (err) => {
			setError(err.message);
		},
	});

	const handleFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setFile(e.target.files?.[0] ?? null);
			setError("");
		},
		[],
	);

	const handleImport = useCallback(async () => {
		if (!file) return;
		setError("");

		try {
			const text = await file.text();
			const json: unknown = JSON.parse(text);
			const parsed = importReferentsSchema.safeParse(json);

			if (!parsed.success) {
				setError(
					`Format invalide : ${parsed.error.issues.map((i) => i.message).join(", ")}`,
				);
				return;
			}

			importMutation.mutate(parsed.data);
		} catch {
			setError("Le fichier n'est pas un JSON valide.");
		}
	}, [file, importMutation]);

	return (
		<dialog
			aria-labelledby={`${MODAL_ID}-title`}
			aria-modal="true"
			className="fr-modal"
			id={MODAL_ID}
			ref={modalRef}
		>
			<div className="fr-container fr-container--fluid fr-container-md">
				<div className="fr-grid-row fr-grid-row--center">
					<div className="fr-col-12 fr-col-md-8 fr-col-lg-6">
						<div className="fr-modal__body">
							<div className="fr-modal__header">
								<button
									aria-controls={MODAL_ID}
									className="fr-btn--close fr-btn"
									onClick={onClose}
									title="Fermer"
									type="button"
								>
									Fermer
								</button>
							</div>
							<div className="fr-modal__content">
								<h2 className="fr-modal__title" id={`${MODAL_ID}-title`}>
									Importer des référents
								</h2>
								<p>Importer depuis un fichier JSON une liste de référents.</p>
								<div
									aria-live="polite"
									className="fr-alert fr-alert--warning fr-mb-3w"
								>
									<p>
										Attention, cette opération remplacera toutes les données
										existantes !
									</p>
								</div>
								<div className="fr-upload-group">
									<label className="fr-label" htmlFor={`${MODAL_ID}-file`}>
										Fichier JSON
									</label>
									<input
										accept=".json"
										className="fr-upload"
										disabled={importMutation.isPending}
										id={`${MODAL_ID}-file`}
										onChange={handleFileChange}
										type="file"
									/>
								</div>
								{error && (
									<div
										aria-live="polite"
										className="fr-alert fr-alert--error fr-alert--sm fr-mt-2w"
									>
										<p>{error}</p>
									</div>
								)}
								{importMutation.isPending && (
									<div
										aria-live="polite"
										className="fr-alert fr-alert--info fr-alert--sm fr-mt-2w"
									>
										<p>Import en cours...</p>
									</div>
								)}
							</div>
							<div className="fr-modal__footer">
								<ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg">
									<li>
										<button
											className="fr-btn fr-btn--primary"
											disabled={!file || importMutation.isPending}
											onClick={handleImport}
											type="button"
										>
											Importer
										</button>
									</li>
									<li>
										<button
											className="fr-btn fr-btn--secondary"
											onClick={onClose}
											type="button"
										>
											Annuler
										</button>
									</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			</div>
		</dialog>
	);
}
