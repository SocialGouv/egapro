"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { phoneRegex } from "~/modules/profile/phone";
import { api } from "~/trpc/react";

const MODAL_ID = "missing-info-modal";
const MODAL_TITLE_ID = "missing-info-modal-title";

type Props = {
	siren: string;
};

export function MissingInfoModal({ siren }: Props) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const [phone, setPhone] = useState("");
	const [phoneError, setPhoneError] = useState<string | null>(null);

	const updatePhoneMutation = api.profile.updatePhone.useMutation({
		onSuccess: () => {
			closeModal();
			window.location.href = `/declaration-remuneration?siren=${siren}`;
		},
	});

	const closeModal = useCallback(() => {
		const dialog = dialogRef.current;
		if (dialog && typeof window !== "undefined" && "dsfr" in window) {
			(
				window as unknown as {
					dsfr: (el: HTMLElement) => { modal: { conceal: () => void } };
				}
			)
				.dsfr(dialog)
				.modal.conceal();
		}
	}, []);

	// Reset form when modal opens
	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;

		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.attributeName === "open" && dialog.open) {
					setPhone("");
					setPhoneError(null);
					break;
				}
			}
		});

		observer.observe(dialog, { attributes: true, attributeFilter: ["open"] });
		return () => observer.disconnect();
	}, []);

	const validatePhone = (value: string): string | null => {
		if (!value.trim()) return "Le numéro de téléphone est obligatoire.";
		if (!phoneRegex.test(value)) return "Format attendu : 01 22 33 44 55";
		return null;
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const error = validatePhone(phone);
		if (error) {
			setPhoneError(error);
			return;
		}
		setPhoneError(null);
		updatePhoneMutation.mutate({ phone });
	};

	return (
		<dialog
			aria-labelledby={MODAL_TITLE_ID}
			className="fr-modal"
			id={MODAL_ID}
			ref={dialogRef}
		>
			<div className="fr-container fr-container--fluid fr-container-md">
				<div className="fr-grid-row fr-grid-row--center">
					<div className="fr-col-12 fr-col-md-8 fr-col-lg-6">
						<div className="fr-modal__body">
							<div className="fr-modal__header">
								<button
									aria-controls={MODAL_ID}
									className="fr-btn--close fr-btn"
									title="Fermer"
									type="button"
								>
									Fermer
								</button>
							</div>
							<div className="fr-modal__content">
								<h2 className="fr-modal__title" id={MODAL_TITLE_ID}>
									Informations manquantes
								</h2>
								<p className="fr-text--regular fr-mb-3w">
									Pour continuer, vous devez ajouter un numéro de téléphone à
									votre profil.
								</p>
								<form id="missing-info-form" onSubmit={handleSubmit}>
									<div
										className={`fr-input-group${phoneError ? "fr-input-group--error" : ""}`}
									>
										<label className="fr-label" htmlFor="missing-info-phone">
											Numéro de téléphone (obligatoire)
											<span className="fr-hint-text">
												Format attendu : 01 22 33 44 55
											</span>
										</label>
										<input
											aria-describedby="missing-info-phone-messages"
											className="fr-input"
											id="missing-info-phone"
											onChange={(e) => {
												setPhone(e.target.value);
												if (phoneError) setPhoneError(null);
											}}
											type="tel"
											value={phone}
										/>
										<div
											aria-live="polite"
											className="fr-messages-group"
											id="missing-info-phone-messages"
										>
											{phoneError && (
												<p className="fr-message fr-message--error">
													{phoneError}
												</p>
											)}
										</div>
									</div>
								</form>
							</div>
							<div className="fr-modal__footer">
								<ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg">
									<li>
										<button
											disabled={updatePhoneMutation.isPending}
											form="missing-info-form"
											type="submit"
											className="fr-btn"
										>
											Commencer la déclaration
										</button>
									</li>
									<li>
										<button
											aria-controls={MODAL_ID}
											className="fr-btn fr-btn--secondary"
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
