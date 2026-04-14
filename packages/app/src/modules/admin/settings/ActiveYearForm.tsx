"use client";

import { useState } from "react";

import { useZodForm } from "~/modules/shared/useZodForm";
import { api } from "~/trpc/react";

import { setActiveYearSchema } from "./schemas";

type Props = {
	initialActiveYear: number | null;
	fallbackYear: number;
};

/**
 * Single-field form that sets the platform-wide "active campaign year".
 */
export function ActiveYearForm({ initialActiveYear, fallbackYear }: Props) {
	const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
	const [serverError, setServerError] = useState<string | null>(null);

	const utils = api.useUtils();
	const form = useZodForm(setActiveYearSchema, {
		defaultValues: {
			activeCampaignYear: initialActiveYear ?? fallbackYear,
		},
	});

	const mutation = api.adminSettings.setActiveCampaignYear.useMutation({
		onSuccess: async () => {
			setStatus("success");
			setServerError(null);
			await utils.adminSettings.getOverview.invalidate();
		},
		onError: (err) => {
			setStatus("error");
			setServerError(err.message);
		},
	});

	const onSubmit = form.handleSubmit((values) => {
		setStatus("idle");
		mutation.mutate(values);
	});

	const fieldError = form.formState.errors.activeCampaignYear?.message;

	return (
		<form noValidate onSubmit={onSubmit}>
			<div
				className={
					fieldError ? "fr-input-group fr-input-group--error" : "fr-input-group"
				}
			>
				<label className="fr-label" htmlFor="active-campaign-year">
					Année de campagne active
					<span className="fr-hint-text">
						Année utilisée par défaut pour les déclarations et calculs.
					</span>
				</label>
				<input
					aria-describedby={
						fieldError ? "active-campaign-year-error" : undefined
					}
					aria-invalid={Boolean(fieldError)}
					className="fr-input"
					id="active-campaign-year"
					inputMode="numeric"
					required
					type="number"
					{...form.register("activeCampaignYear", { valueAsNumber: true })}
				/>
				{fieldError && (
					<p className="fr-error-text" id="active-campaign-year-error">
						{fieldError}
					</p>
				)}
			</div>

			{status === "success" && (
				<div
					aria-live="polite"
					className="fr-alert fr-alert--success fr-alert--sm fr-mt-2w"
				>
					<p>Année de campagne active enregistrée.</p>
				</div>
			)}
			{status === "error" && serverError && (
				<div className="fr-alert fr-alert--error fr-mt-2w" role="alert">
					<p>{serverError}</p>
				</div>
			)}

			<ul className="fr-btns-group fr-btns-group--inline-sm fr-mt-2w">
				<li>
					<button
						className="fr-btn"
						disabled={mutation.isPending}
						type="submit"
					>
						{mutation.isPending ? "Enregistrement…" : "Enregistrer"}
					</button>
				</li>
			</ul>
		</form>
	);
}
