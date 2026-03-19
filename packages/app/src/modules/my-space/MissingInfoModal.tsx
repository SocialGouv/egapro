"use client";

import { useCallback, useRef } from "react";

import { updatePhoneSchema } from "~/modules/profile/schemas";
import { getDsfrModal } from "~/modules/shared";
import { PhoneField } from "~/modules/shared/PhoneField";
import { useDsfrDialogOpen } from "~/modules/shared/useDsfrDialogOpen";
import { useZodForm } from "~/modules/shared/useZodForm";
import { api } from "~/trpc/react";

const MODAL_ID = "missing-info-modal";
const MODAL_TITLE_ID = "missing-info-modal-title";

type Props = {
	siren: string;
};

export function MissingInfoModal({ siren }: Props) {
	const dialogRef = useRef<HTMLDialogElement>(null);

	const form = useZodForm(updatePhoneSchema, {
		defaultValues: { phone: "" },
	});

	const phoneError = form.formState.errors.phone?.message ?? null;

	const updatePhoneMutation = api.profile.updatePhone.useMutation({
		onSuccess: () => {
			closeModal();
			window.location.href = `/declaration-remuneration?siren=${siren}`;
		},
	});

	const closeModal = useCallback(() => {
		const dialog = dialogRef.current;
		if (dialog) getDsfrModal(dialog)?.conceal();
	}, []);

	useDsfrDialogOpen(
		dialogRef,
		useCallback(() => form.reset({ phone: "" }), [form]),
	);

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
								<h2 className="fr-modal__title" id={MODAL_TITLE_ID}>
									Informations manquantes
								</h2>
								<p className="fr-text--regular fr-mb-3w">
									Pour continuer, vous devez ajouter un numéro de téléphone à
									votre profil.
								</p>
								<form id="missing-info-form" onSubmit={onSubmit}>
									<PhoneField
										error={phoneError}
										inputId="missing-info-phone"
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
											form="missing-info-form"
											type="submit"
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
