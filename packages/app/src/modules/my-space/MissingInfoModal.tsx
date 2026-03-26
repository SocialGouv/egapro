"use client";

import { useCallback, useMemo, useRef, useState } from "react";

import { getDsfrModal } from "~/modules/shared";
import { PhoneField } from "~/modules/shared/PhoneField";
import { useDsfrDialogOpen } from "~/modules/shared/useDsfrDialogOpen";
import { useZodForm } from "~/modules/shared/useZodForm";
import { api } from "~/trpc/react";

import { createMissingInfoSchema } from "./schemas";

const MODAL_ID = "missing-info-modal";
const MODAL_TITLE_ID = "missing-info-modal-title";

type Props = {
	siren: string;
	userPhone: string | null;
	hasCse: boolean | null;
};

function getDescription(needsPhone: boolean, needsCse: boolean): string {
	if (needsPhone && needsCse) {
		return "Pour continuer, vous devez renseigner un numéro de téléphone et indiquer si un CSE a été mis en place dans votre entreprise.";
	}
	if (needsPhone) {
		return "Pour continuer, vous devez ajouter un numéro de téléphone à votre profil.";
	}
	return "Pour continuer, vous devez indiquer si un CSE a été mis en place dans votre entreprise.";
}

export function MissingInfoModal({ siren, userPhone, hasCse }: Props) {
	const dialogRef = useRef<HTMLDialogElement>(null);
	const needsPhone = !userPhone;
	const needsCse = hasCse === null;

	const schema = useMemo(
		() => createMissingInfoSchema(needsPhone, needsCse),
		[needsPhone, needsCse],
	);

	const form = useZodForm(schema, {
		defaultValues: { phone: "", hasCse: undefined },
	});

	const phoneError = form.formState.errors.phone?.message ?? null;
	const cseError = form.formState.errors.hasCse?.message ?? null;

	const updatePhoneMutation = api.profile.updatePhone.useMutation();
	const updateHasCseMutation = api.company.updateHasCse.useMutation();

	const closeModal = useCallback(() => {
		const dialog = dialogRef.current;
		if (dialog) getDsfrModal(dialog)?.conceal();
	}, []);

	useDsfrDialogOpen(
		dialogRef,
		useCallback(() => form.reset({ phone: "", hasCse: undefined }), [form]),
	);

	const [submitError, setSubmitError] = useState<string | null>(null);

	const handleSave = form.handleSubmit(async (data) => {
		try {
			setSubmitError(null);
			if (needsPhone) {
				await updatePhoneMutation.mutateAsync({ phone: data.phone });
			}
			if (needsCse) {
				const hasCseValue = data.hasCse as boolean;
				await updateHasCseMutation.mutateAsync({ siren, hasCse: hasCseValue });
			}
			closeModal();
			window.location.href = `/declaration-remuneration?siren=${siren}`;
		} catch {
			setSubmitError(
				"Une erreur est survenue lors de l'enregistrement. Veuillez réessayer.",
			);
		}
	});

	const isPending =
		updatePhoneMutation.isPending || updateHasCseMutation.isPending;

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
								<h2 className="fr-modal__title" id={MODAL_TITLE_ID}>
									Informations manquantes
								</h2>
								<p className="fr-text--regular fr-mb-3w">
									{getDescription(needsPhone, needsCse)}
								</p>
								{needsPhone && (
									<PhoneField
										error={phoneError}
										inputId="missing-info-phone"
										registration={form.register("phone")}
									/>
								)}
								{needsCse && (
									<fieldset
										aria-describedby={
											cseError ? "missing-info-cse-error" : undefined
										}
										className={
											cseError
												? "fr-fieldset fr-fieldset--error"
												: "fr-fieldset"
										}
									>
										<legend className="fr-fieldset__legend fr-text--regular">
											Un CSE a-t-il été mis en place dans votre entreprise ?
										</legend>
										<div className="fr-fieldset__element">
											<div className="fr-radio-group fr-radio-rich">
												<input
													id="missing-info-cse-yes"
													type="radio"
													value="true"
													{...form.register("hasCse")}
												/>
												<label
													className="fr-label"
													htmlFor="missing-info-cse-yes"
												>
													Oui
												</label>
											</div>
										</div>
										<div className="fr-fieldset__element">
											<div className="fr-radio-group fr-radio-rich">
												<input
													id="missing-info-cse-no"
													type="radio"
													value="false"
													{...form.register("hasCse")}
												/>
												<label
													className="fr-label"
													htmlFor="missing-info-cse-no"
												>
													Non
												</label>
											</div>
										</div>
										{cseError && (
											<div
												className="fr-messages-group"
												id="missing-info-cse-error"
												role="alert"
											>
												<p className="fr-message fr-message--error">
													{cseError}
												</p>
											</div>
										)}
									</fieldset>
								)}
								{submitError && (
									<div
										aria-live="polite"
										className="fr-alert fr-alert--error fr-mt-2w"
									>
										<p>{submitError}</p>
									</div>
								)}
							</div>
							<div className="fr-modal__footer">
								<ul className="fr-btns-group fr-btns-group--right fr-btns-group--inline-reverse fr-btns-group--inline-lg">
									<li>
										<button
											className="fr-btn"
											disabled={isPending}
											onClick={handleSave}
											type="button"
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
											Retour
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
