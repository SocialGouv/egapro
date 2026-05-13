"use client";

import { useEffect, useState } from "react";

import { useZodForm } from "~/modules/shared/useZodForm";
import { api } from "~/trpc/react";
import { notificationPreferencesSchema } from "./schemas";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "./types";

type Status = "idle" | "saving" | "saved" | "error";

export function NotificationPreferencesForm() {
	const [status, setStatus] = useState<Status>("idle");
	const [feedback, setFeedback] = useState<string | null>(null);

	const form = useZodForm(notificationPreferencesSchema, {
		defaultValues: DEFAULT_NOTIFICATION_PREFERENCES,
	});

	const preferencesQuery = api.notificationPreferences.get.useQuery();
	const updateMutation = api.notificationPreferences.update.useMutation({
		onSuccess: () => {
			setStatus("saved");
			setFeedback("Vos préférences ont bien été enregistrées.");
		},
		onError: (error) => {
			setStatus("error");
			setFeedback(error.message);
		},
	});

	useEffect(() => {
		if (preferencesQuery.data) {
			form.reset(preferencesQuery.data);
		}
	}, [preferencesQuery.data, form]);

	const onSubmit = form.handleSubmit((values) => {
		setStatus("saving");
		setFeedback(null);
		updateMutation.mutate(values);
	});

	const emailEnabled = form.watch("emailEnabled");

	return (
		<form noValidate onSubmit={onSubmit}>
			<fieldset className="fr-fieldset">
				<legend className="fr-fieldset__legend">
					<h2 className="fr-h6">Notifications par e-mail</h2>
				</legend>

				<div className="fr-fieldset__element">
					<div className="fr-checkbox-group">
						<input
							id="notif-emailEnabled"
							type="checkbox"
							{...form.register("emailEnabled")}
						/>
						<label className="fr-label" htmlFor="notif-emailEnabled">
							Recevoir des e-mails de la plateforme Egapro
							<span className="fr-hint-text">
								Désactiver cette option suspend tous les e-mails que la
								plateforme vous envoie (confirmations et rappels inclus).
							</span>
						</label>
					</div>
				</div>

				<div className="fr-fieldset__element">
					<div className="fr-checkbox-group">
						<input
							disabled={!emailEnabled}
							id="notif-confirmations"
							type="checkbox"
							{...form.register("confirmations")}
						/>
						<label className="fr-label" htmlFor="notif-confirmations">
							Confirmations de soumission
							<span className="fr-hint-text">
								Accusés de réception des déclarations, avis CSE, évaluation
								conjointe.
							</span>
						</label>
					</div>
				</div>

				<div className="fr-fieldset__element">
					<div className="fr-checkbox-group">
						<input
							disabled={!emailEnabled}
							id="notif-reminders"
							type="checkbox"
							{...form.register("reminders")}
						/>
						<label className="fr-label" htmlFor="notif-reminders">
							Rappels d'échéances
							<span className="fr-hint-text">
								Ouverture de campagne, rappels de date limite, seconde
								déclaration.
							</span>
						</label>
					</div>
				</div>
			</fieldset>

			{feedback ? (
				<div
					aria-live="polite"
					className={
						status === "error"
							? "fr-alert fr-alert--error fr-alert--sm fr-mb-3w"
							: "fr-alert fr-alert--success fr-alert--sm fr-mb-3w"
					}
				>
					<p>{feedback}</p>
				</div>
			) : null}

			<ul className="fr-btns-group fr-btns-group--inline-md">
				<li>
					<button
						className="fr-btn"
						disabled={status === "saving" || preferencesQuery.isLoading}
						type="submit"
					>
						Enregistrer mes préférences
					</button>
				</li>
			</ul>
		</form>
	);
}
