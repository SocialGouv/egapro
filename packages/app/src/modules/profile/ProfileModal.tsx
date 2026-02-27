"use client";

import { useCallback, useRef, useState } from "react";

import { api } from "~/trpc/react";
import styles from "./ProfileModal.module.scss";

const MODAL_ID = "profile-modal";
const MODAL_TITLE_ID = "profile-modal-title";

/** DSFR modal displaying user profile with editable phone field. */
export function ProfileModal() {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const [phone, setPhone] = useState("");
	const [phoneError, setPhoneError] = useState<string | null>(null);

	const profileQuery = api.profile.get.useQuery(undefined, {
		enabled: false,
	});

	const updatePhoneMutation = api.profile.updatePhone.useMutation({
		onSuccess: () => {
			closeModal();
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

	const handleDialogOpen = useCallback(() => {
		profileQuery.refetch().then((result) => {
			if (result.data) {
				setPhone(result.data.phone ?? "");
				setPhoneError(null);
			}
		});
	}, [profileQuery]);

	const validatePhone = (value: string): string | null => {
		if (!value.trim()) return "Le numéro de téléphone est obligatoire.";
		if (!/^\d{2}( \d{2}){4}$/.test(value))
			return "Format attendu : 01 22 33 44 55";
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
			onTransitionEnd={(e) => {
				if (e.target === dialogRef.current && dialogRef.current?.open) {
					handleDialogOpen();
				}
			}}
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
									Mon profil
								</h2>
								<p className="fr-text--regular fr-mb-3w">
									Les informations sont issues de votre compte ProConnect. Merci
									de vérifier les données affichées et de compléter les
									informations manquantes si nécessaire.
								</p>
								<form id="profile-form" onSubmit={handleSubmit}>
									<div className="fr-grid-row fr-grid-row--gutters fr-mb-3w">
										<div className="fr-col-12 fr-col-md-6">
											<ReadonlyField
												label="Nom"
												value={profileQuery.data?.lastName}
											/>
										</div>
										<div className="fr-col-12 fr-col-md-6">
											<ReadonlyField
												label="Prénom"
												value={profileQuery.data?.firstName}
											/>
										</div>
									</div>
									<div className={`fr-mb-3w ${styles.narrowField}`}>
										<ReadonlyField
											label="Email du déclarant"
											showEditIcon={false}
											value={profileQuery.data?.email}
										/>
									</div>
									<div
										className={`fr-input-group${phoneError ? " fr-input-group--error" : ""} ${styles.narrowField}`}
									>
										<label className="fr-label" htmlFor="profile-phone">
											Numéro de téléphone (obligatoire)
											<span className="fr-hint-text">
												Format attendu : 01 22 33 44 55
											</span>
										</label>
										<input
											aria-describedby="profile-phone-messages"
											className="fr-input"
											id="profile-phone"
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
											id="profile-phone-messages"
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
											form="profile-form"
											type="submit"
											className="fr-btn"
										>
											Enregistrer
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

type ReadonlyFieldProps = {
	label: string;
	showEditIcon?: boolean;
	value: string | null | undefined;
};

function ReadonlyField({ label, showEditIcon = true, value }: ReadonlyFieldProps) {
	return (
		<div className={styles.readonlyField}>
			<div className={styles.readonlyLabel}>
				<span>{label}</span>
				{showEditIcon && (
					<span aria-hidden="true" className="fr-icon-edit-line fr-icon--sm" />
				)}
			</div>
			<div className={styles.readonlyValue}>{value || "—"}</div>
		</div>
	);
}
