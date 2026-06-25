"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useIsImpersonating } from "~/modules/auth";
import { getDsfrModal } from "~/modules/shared";
import { PhoneField } from "~/modules/shared/PhoneField";
import { useDsfrDialogOpen } from "~/modules/shared/useDsfrDialogOpen";
import { useZodForm } from "~/modules/shared/useZodForm";
import { api } from "~/trpc/react";

import { DECLARATION_PROCESS_PANEL_ID } from "./DeclarationProcessPanel";
import styles from "./DeclarationProcessPanel.module.scss";
import { createMissingInfoSchema } from "./schemas";
import { useUpdateHasCse } from "./useUpdateHasCse";

export const MISSING_INFO_PANEL_ID = "missing-info-modal";
const PANEL_TITLE_ID = "missing-info-modal-title";

type Props = {
	siren: string;
	userPhone: string | null;
	hasCse: boolean | null;
};

function getDescription(needsPhone: boolean, needsCse: boolean): string {
	if (needsPhone && needsCse) {
		return "Pour continuer, vous devez ajouter un numéro de téléphone à votre profil et nous indiquer si un CSE a été mis en place.";
	}
	if (needsPhone) {
		return "Pour continuer, vous devez ajouter un numéro de téléphone à votre profil.";
	}
	return "Pour continuer, vous devez indiquer si un CSE a été mis en place dans votre entreprise.";
}

type OpenerType = "remuneration" | "representation";

export function MissingInfoModal({ siren, userPhone, hasCse }: Props) {
	const isImpersonating = useIsImpersonating();
	const dialogRef = useRef<HTMLDialogElement>(null);
	const openerTypeRef = useRef<OpenerType>("remuneration");
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
	const updateHasCseMutation = useUpdateHasCse();

	const closeModal = useCallback(() => {
		const dialog = dialogRef.current;
		if (dialog) getDsfrModal(dialog)?.conceal();
	}, []);

	// Capture the opener type at click time (before the DSFR dialog opens),
	// which is more reliable than querying the DOM after the dialog animation.
	useEffect(() => {
		const handler = (e: Event) => {
			const target = (e.target as HTMLElement).closest<HTMLElement>(
				`[aria-controls="${MISSING_INFO_PANEL_ID}"]`,
			);
			if (!target) return;
			openerTypeRef.current =
				target.dataset.declarationType === "representation"
					? "representation"
					: "remuneration";
		};
		document.addEventListener("click", handler, true);
		return () => document.removeEventListener("click", handler, true);
	}, []);

	useDsfrDialogOpen(
		dialogRef,
		useCallback(() => {
			form.reset({ phone: "", hasCse: undefined });
		}, [form]),
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
			if (openerTypeRef.current === "remuneration") {
				// Register listener BEFORE closing so we catch the dsfr.conceal event
				const dialog = dialogRef.current;
				if (dialog) {
					dialog.addEventListener(
						"dsfr.conceal",
						() => {
							const panel = document.getElementById(
								DECLARATION_PROCESS_PANEL_ID,
							);
							if (panel) getDsfrModal(panel)?.disclose();
						},
						{ once: true },
					);
				}
				closeModal();
			} else {
				closeModal();
				window.location.href = `/declaration-remuneration?siren=${siren}`;
			}
		} catch {
			setSubmitError(
				"Une erreur est survenue lors de l'enregistrement. Veuillez réessayer.",
			);
		}
	});

	const isPending =
		updatePhoneMutation.isPending || updateHasCseMutation.isPending;

	// Admin impersonation is read-only: every write would be blocked server-side
	// (issue #3230), so prompting for missing info is pure noise.
	if (isImpersonating) {
		return null;
	}

	return (
		<dialog
			aria-labelledby={PANEL_TITLE_ID}
			aria-modal="true"
			className={`fr-modal ${styles.sidePanel}`}
			id={MISSING_INFO_PANEL_ID}
			ref={dialogRef}
		>
			<div className={styles.panelContainer}>
				<div className={styles.panelHeader}>
					<button
						aria-controls={MISSING_INFO_PANEL_ID}
						className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-btn--icon-right fr-icon-close-line"
						title="Fermer"
						type="button"
					>
						Fermer
					</button>
				</div>
				<div className={styles.panelContent}>
					<div>
						<h2 className="fr-h5 fr-mb-3w" id={PANEL_TITLE_ID}>
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
									cseError ? "fr-fieldset fr-fieldset--error" : "fr-fieldset"
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
										<label className="fr-label" htmlFor="missing-info-cse-yes">
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
										<label className="fr-label" htmlFor="missing-info-cse-no">
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
										<p className="fr-message fr-message--error">{cseError}</p>
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
					<div>
						<div className={styles.helpSection}>
							<hr className="fr-hr" />
							<p className="fr-text--lg fr-text--bold fr-mb-0">
								Pour vous aider
							</p>
							<div className={styles.helpLinks}>
								<button className="fr-link" type="button">
									Détail des étapes
								</button>
								<button className="fr-link" type="button">
									Aides
								</button>
							</div>
						</div>
						<div className={styles.footer}>
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
										aria-controls={MISSING_INFO_PANEL_ID}
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
		</dialog>
	);
}
