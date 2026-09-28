"use client";

import { useState } from "react";
import { useZodForm } from "~/modules/shared/useZodForm";
import { api } from "~/trpc/react";
import {
	type UpdateLockTimeoutInput,
	updateLockTimeoutSchema,
} from "./schemas";

type Props = {
	initialTimeoutMinutes: number;
};

export function LockTimeoutForm({ initialTimeoutMinutes }: Props) {
	const utils = api.useUtils();
	const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
	const [serverError, setServerError] = useState<string | null>(null);

	const form = useZodForm(updateLockTimeoutSchema, {
		defaultValues: { timeoutMinutes: initialTimeoutMinutes },
	});

	const mutation = api.adminSettings.updateLockTimeout.useMutation({
		onSuccess: async () => {
			setStatus("success");
			setServerError(null);
			await utils.adminSettings.getLockTimeout.invalidate();
		},
		onError: (err) => {
			setStatus("error");
			setServerError(err.message);
		},
	});

	const onSubmit = form.handleSubmit((values: UpdateLockTimeoutInput) => {
		setStatus("idle");
		mutation.mutate(values);
	});

	const error = form.formState.errors.timeoutMinutes?.message;

	return (
		<form autoComplete="off" noValidate onSubmit={onSubmit}>
			<div
				className={
					error ? "fr-input-group fr-input-group--error" : "fr-input-group"
				}
			>
				<label className="fr-label" htmlFor="lock-timeout-minutes">
					Délai d'expiration du verrou de déclaration (minutes)
					<span className="fr-hint-text">
						Valeur entre 1 et 1440 minutes (24 heures maximum).
					</span>
				</label>
				<input
					aria-describedby={error ? "lock-timeout-minutes-error" : undefined}
					aria-invalid={Boolean(error)}
					className="fr-input"
					id="lock-timeout-minutes"
					max={1440}
					min={1}
					type="number"
					{...form.register("timeoutMinutes", { valueAsNumber: true })}
				/>
				{error && (
					<p className="fr-error-text" id="lock-timeout-minutes-error">
						{error}
					</p>
				)}
			</div>

			{status === "success" && (
				<div
					aria-live="polite"
					className="fr-alert fr-alert--success fr-alert--sm fr-mt-2w"
				>
					<p>Délai d'expiration enregistré.</p>
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
