"use client";

import { useCallback, useRef } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

import { getDsfrModal } from "~/modules/shared";
import { PhoneField } from "~/modules/shared/PhoneField";
import { useDsfrDialogOpen } from "~/modules/shared/useDsfrDialogOpen";
import { useZodForm } from "~/modules/shared/useZodForm";
import { api } from "~/trpc/react";
import styles from "./ProfileModal.module.scss";
import { updateProfileSchema } from "./schemas";

const MODAL_ID = "profile-modal";
const MODAL_TITLE_ID = "profile-modal-title";

/** DSFR modal displaying the declarant profile with editable identity fields. */
export function ProfileModal() {
	const dialogRef = useRef<HTMLDialogElement>(null);

	const form = useZodForm(updateProfileSchema, {
		defaultValues: { firstName: "", lastName: "", phone: "" },
	});

	const { errors } = form.formState;

	const profileQuery = api.profile.get.useQuery(undefined, {
		enabled: false,
	});

	const updateProfileMutation = api.profile.updateProfile.useMutation({
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
					form.reset({
						firstName: result.data.firstName ?? "",
						lastName: result.data.lastName ?? "",
						phone: result.data.phone ?? "",
					});
				}
			})
			.catch(() => {
				// Query error is already handled by React Query's error state
			});
	}, [profileQuery, form]);

	useDsfrDialogOpen(dialogRef, handleDialogOpen);

	const onSubmit = form.handleSubmit((data) => {
		updateProfileMutation.mutate(data);
	});

	return (
		<dialog
			aria-labelledby={MODAL_TITLE_ID}
			aria-modal="true"
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
								<div className="fr-grid-row fr-grid-row--middle fr-mb-4w">
									<div className="fr-col">
										<h2 className="fr-modal__title fr-mb-0" id={MODAL_TITLE_ID}>
											Mon profil
										</h2>
									</div>
									<div className="fr-col-auto">
										<button
											aria-describedby="profile-tooltip"
											className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-icon-question-line"
											type="button"
										>
											<span className="fr-sr-only">Aide</span>
										</button>
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
								<p className="fr-text--regular fr-text-title--grey fr-mb-2w">
									Vérifier les données affichées et compléter les informations
									manquantes si nécessaire.
								</p>
								<p className="fr-text--regular fr-text-title--grey fr-mb-4w">
									Tous les champs sont obligatoires.
								</p>
								<form autoComplete="off" id="profile-form" onSubmit={onSubmit}>
									<div className="fr-grid-row fr-grid-row--gutters fr-mb-4w">
										<div className="fr-col-12 fr-col-md-6">
											<IdentityField
												error={errors.lastName?.message ?? null}
												inputId="profile-last-name"
												label="Nom"
												registration={form.register("lastName")}
											/>
										</div>
										<div className="fr-col-12 fr-col-md-6">
											<IdentityField
												error={errors.firstName?.message ?? null}
												inputId="profile-first-name"
												label="Prénom"
												registration={form.register("firstName")}
											/>
										</div>
									</div>
									<div className={`fr-mb-4w ${styles.emailBlock}`}>
										<p className="fr-mb-0">
											E-mail :{" "}
											<strong>{profileQuery.data?.email || "—"}</strong>
										</p>
										<p className="fr-text--sm fr-text-mention--grey fr-mb-0">
											Source : ProConnect.
										</p>
									</div>
									<PhoneField
										className={styles.narrowField}
										error={errors.phone?.message ?? null}
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
											disabled={updateProfileMutation.isPending}
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

type IdentityFieldProps = {
	error: string | null;
	inputId: string;
	label: string;
	registration: UseFormRegisterReturn;
};

function IdentityField({
	error,
	inputId,
	label,
	registration,
}: IdentityFieldProps) {
	const messagesId = `${inputId}-messages`;
	return (
		<div
			className={
				error ? "fr-input-group fr-input-group--error" : "fr-input-group"
			}
		>
			<label className="fr-label" htmlFor={inputId}>
				{label}
			</label>
			<input
				aria-describedby={messagesId}
				aria-invalid={error ? "true" : undefined}
				aria-required="true"
				className="fr-input"
				id={inputId}
				type="text"
				{...registration}
			/>
			<div
				aria-atomic="true"
				aria-live="polite"
				className="fr-messages-group"
				id={messagesId}
			>
				{error && <p className="fr-message fr-message--error">{error}</p>}
			</div>
		</div>
	);
}
