"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

import { useDsfrModal } from "~/modules/shared";
import { api } from "~/trpc/react";

import { ImportReferentsConfirmStep } from "./ImportReferentsConfirmStep";
import { type ImportReferentsInput, importReferentsSchema } from "./schemas";

const MODAL_ID = "admin-import-referents-modal";
const CONFIRM_HEADING_ID = `${MODAL_ID}-confirm-title`;
const BUTTONS_GROUP_CLASS =
	"fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg";

type PendingImport = {
	referents: ImportReferentsInput;
	existingCount: number;
};

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
	const [pendingImport, setPendingImport] = useState<PendingImport | null>(
		null,
	);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const titleRef = useRef<HTMLHeadingElement>(null);
	const confirmHeadingRef = useRef<HTMLHeadingElement>(null);
	const modalEpochRef = useRef(0);
	const requestEpochRef = useRef(0);
	const submitInProgressRef = useRef(false);
	const resetForm = useCallback(() => {
		setFile(null);
		setError("");
		setPendingImport(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
	}, []);
	const utils = api.useUtils();
	const importMutation = api.adminReferents.import.useMutation({
		onSuccess: () => {
			submitInProgressRef.current = false;
			onSuccess();
			if (requestEpochRef.current === modalEpochRef.current) {
				onClose();
			}
		},
		onError: (err) => {
			submitInProgressRef.current = false;
			if (requestEpochRef.current === modalEpochRef.current) {
				setError(err.message);
			}
		},
	});

	useEffect(() => {
		const modal = modalRef.current;
		if (!modal) return;
		const handleConceal = () => {
			modalEpochRef.current += 1;
			resetForm();
			if (!importMutation.isPending) importMutation.reset();
		};
		modal.addEventListener("dsfr.conceal", handleConceal);
		return () => modal.removeEventListener("dsfr.conceal", handleConceal);
	}, [importMutation, modalRef, resetForm]);

	const handleFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setFile(e.target.files?.[0] ?? null);
			setError("");
		},
		[],
	);

	const handleReview = useCallback(async () => {
		if (!file || importMutation.isPending || submitInProgressRef.current)
			return;
		submitInProgressRef.current = true;
		const submitEpoch = modalEpochRef.current;
		const isStale = () => submitEpoch !== modalEpochRef.current;
		setError("");

		let parsed: ReturnType<typeof importReferentsSchema.safeParse>;
		try {
			const text = await file.text();
			parsed = importReferentsSchema.safeParse(JSON.parse(text));
		} catch {
			submitInProgressRef.current = false;
			if (!isStale()) setError("Le fichier n'est pas un JSON valide.");
			return;
		}
		if (isStale()) {
			submitInProgressRef.current = false;
			return;
		}
		if (!parsed.success) {
			submitInProgressRef.current = false;
			setError(
				`Format invalide : ${parsed.error.issues.map((i) => i.message).join(", ")}`,
			);
			return;
		}

		try {
			const { total } = await utils.adminReferents.count.fetch();
			submitInProgressRef.current = false;
			if (isStale()) return;
			flushSync(() =>
				setPendingImport({ referents: parsed.data, existingCount: total }),
			);
			confirmHeadingRef.current?.focus();
		} catch {
			submitInProgressRef.current = false;
			if (!isStale()) {
				setError(
					"Le nombre de référents existants n'a pas pu être vérifié. Veuillez réessayer.",
				);
			}
		}
	}, [file, importMutation, utils]);

	const handleConfirm = useCallback(() => {
		if (
			!pendingImport ||
			importMutation.isPending ||
			submitInProgressRef.current
		)
			return;
		submitInProgressRef.current = true;
		requestEpochRef.current = modalEpochRef.current;
		setError("");
		importMutation.mutate(pendingImport.referents);
	}, [pendingImport, importMutation]);

	const handleBack = useCallback(() => {
		if (importMutation.isPending) return;
		importMutation.reset();
		setError("");
		flushSync(() => setPendingImport(null));
		titleRef.current?.focus();
	}, [importMutation]);

	const isConfirming = pendingImport !== null;

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
								<h2
									className="fr-modal__title"
									id={`${MODAL_ID}-title`}
									ref={titleRef}
									tabIndex={-1}
								>
									Importer des référents
								</h2>
								<div hidden={isConfirming}>
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
											ref={fileInputRef}
											type="file"
										/>
									</div>
								</div>
								{pendingImport && file && (
									<ImportReferentsConfirmStep
										existingCount={pendingImport.existingCount}
										fileName={file.name}
										headingId={CONFIRM_HEADING_ID}
										headingRef={confirmHeadingRef}
										importedCount={pendingImport.referents.length}
									/>
								)}
								{error && (
									<div
										className="fr-alert fr-alert--error fr-alert--sm fr-mt-2w"
										role="alert"
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
								{isConfirming && (
									<ConfirmActions
										isPending={importMutation.isPending}
										onBack={handleBack}
										onCancel={onClose}
										onConfirm={handleConfirm}
									/>
								)}
								{!isConfirming && (
									<ul className={BUTTONS_GROUP_CLASS}>
										<li>
											<button
												className="fr-btn fr-btn--primary"
												disabled={!file || importMutation.isPending}
												onClick={handleReview}
												type="button"
											>
												Vérifier l'import
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
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</dialog>
	);
}

type ConfirmActionsProps = {
	isPending: boolean;
	onBack: () => void;
	onCancel: () => void;
	onConfirm: () => void;
};

function ConfirmActions({
	isPending,
	onBack,
	onCancel,
	onConfirm,
}: ConfirmActionsProps) {
	return (
		<ul className={BUTTONS_GROUP_CLASS}>
			<li>
				<button
					aria-disabled={isPending || undefined}
					className="fr-btn fr-btn--primary"
					onClick={onConfirm}
					type="button"
				>
					Confirmer l'import
				</button>
			</li>
			<li>
				<button
					aria-disabled={isPending || undefined}
					className="fr-btn fr-btn--secondary"
					onClick={onBack}
					type="button"
				>
					Revenir au choix du fichier
				</button>
			</li>
			<li>
				<button
					className="fr-btn fr-btn--tertiary"
					onClick={onCancel}
					type="button"
				>
					Annuler
				</button>
			</li>
		</ul>
	);
}
