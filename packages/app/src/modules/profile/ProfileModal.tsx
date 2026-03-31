"use client";

import { useCallback, useRef } from "react";

import { getDsfrModal } from "~/modules/shared";
import { PhoneField } from "~/modules/shared/PhoneField";
import { useDsfrDialogOpen } from "~/modules/shared/useDsfrDialogOpen";
import { useZodForm } from "~/modules/shared/useZodForm";
import { api } from "~/trpc/react";
import styles from "./ProfileModal.module.scss";
import { updatePhoneSchema } from "./schemas";

const MODAL_ID = "profile-modal";
const MODAL_TITLE_ID = "profile-modal-title";

/** DSFR modal displaying user profile with editable phone field. */
export function ProfileModal() {
	const dialogRef = useRef<HTMLDialogElement>(null);

	const form = useZodForm(updatePhoneSchema, {
		defaultValues: { phone: "" },
	});

	const phoneError = form.formState.errors.phone?.message ?? null;

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
		if (dialog) getDsfrModal(dialog)?.conceal();
	}, []);

	const handleDialogOpen = useCallback(() => {
		profileQuery
			.refetch()
			.then((result) => {
				if (result.data) {
					form.setValue("phone", result.data.phone ?? "");
					form.clearErrors();
				}
			})
			.catch(() => {
				// Query error is already handled by React Query's error state
			});
	}, [profileQuery, form]);

	useDsfrDialogOpen(dialogRef, handleDialogOpen);

	const onSubmit = form.handleSubmit((data) => {
		updatePhoneMutation.mutate(data);
	});

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
								<div className="fr-grid-row fr-grid-row--middle">
									<div className="fr-col">
										<h2 className="fr-modal__title fr-mb-0" id={MODAL_TITLE_ID}>
											Mon profil
										</h2>
									</div>
									<div className="fr-col-auto">
										<button
											aria-describedby="profile-tooltip"
											aria-label="Aide"
											className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-icon-question-line"
											type="button"
										/>
										<span
											className="fr-tooltip fr-placement"
											id="profile-tooltip"
											role="tooltip"
										>
											Vous pouvez aussi modifier ces informations directement
											sur votre profil ProConnect.
										</span>
									</div>
								</div>
								<p className="fr-text--regular fr-mb-3w">
									Les informations sont issues de votre compte ProConnect. Merci
									de vérifier les données affichées et de compléter les
									informations manquantes si nécessaire.
								</p>
								<form id="profile-form" onSubmit={onSubmit}>
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
									<PhoneField
										className={styles.narrowField}
										error={phoneError}
										inputId="profile-phone"
										registration={form.register("phone")}
									/>
								</form>
							</div>
							<div className="fr-modal__footer">
								<ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg">
									<li>
										<button
											className="fr-btn"
											disabled={updatePhoneMutation.isPending}
											form="profile-form"
											type="submit"
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

function ReadonlyField({
	label,
	showEditIcon = true,
	value,
}: ReadonlyFieldProps) {
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
