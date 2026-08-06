"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

import { useZodForm } from "~/modules/shared/useZodForm";

import { devLoginSchema } from "./schemas";

type Props = {
	callbackUrl?: string;
};

const DEFAULT_CALLBACK = "/mon-espace";

/**
 * `callbackUrl` reaches this form straight from the query string. Anything
 * other than a same-site absolute path — a full URL, a protocol-relative
 * `//evil.tld`, a `javascript:` URI — is dropped rather than navigated to.
 */
function safeCallbackUrl(candidate: string | undefined): string {
	if (!candidate) return DEFAULT_CALLBACK;
	if (!candidate.startsWith("/") || candidate.startsWith("//")) {
		return DEFAULT_CALLBACK;
	}
	return candidate;
}

/**
 * Dev-only sign-in form. Posts to the `dev-auth` credentials provider, which
 * is registered only outside production. Lets a developer — or the pipeline's
 * browser validators — reach an authenticated screen bound to an arbitrary
 * SIRET without going through the external ProConnect sandbox.
 */
export function DevLoginForm({ callbackUrl }: Props) {
	const [serverError, setServerError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const form = useZodForm(devLoginSchema, {
		defaultValues: { email: "", siret: "" },
	});

	const target = safeCallbackUrl(callbackUrl);

	const onSubmit = form.handleSubmit(async (values) => {
		setSubmitting(true);
		setServerError(null);
		const result = await signIn("dev-auth", {
			callbackUrl: target,
			email: values.email,
			redirect: false,
			siret: values.siret,
		});
		if (result?.error) {
			setServerError("Connexion refusée : vérifiez l'e-mail et le SIRET.");
			setSubmitting(false);
			return;
		}
		window.location.assign(target);
	});

	const emailError = form.formState.errors.email?.message;
	const siretError = form.formState.errors.siret?.message;

	return (
		<form autoComplete="off" noValidate onSubmit={onSubmit}>
			<div
				className={
					emailError ? "fr-input-group fr-input-group--error" : "fr-input-group"
				}
			>
				<label className="fr-label" htmlFor="dev-login-email">
					Adresse e-mail
				</label>
				<input
					aria-describedby={emailError ? "dev-login-email-error" : undefined}
					aria-invalid={Boolean(emailError)}
					aria-required="true"
					autoComplete="off"
					className="fr-input"
					id="dev-login-email"
					type="email"
					{...form.register("email")}
				/>
				{emailError && (
					<p className="fr-error-text" id="dev-login-email-error">
						{emailError}
					</p>
				)}
			</div>

			<div
				className={
					siretError ? "fr-input-group fr-input-group--error" : "fr-input-group"
				}
			>
				<label className="fr-label" htmlFor="dev-login-siret">
					SIRET de l'entreprise
					<span className="fr-hint-text">14 chiffres</span>
				</label>
				<input
					aria-describedby={siretError ? "dev-login-siret-error" : undefined}
					aria-invalid={Boolean(siretError)}
					aria-required="true"
					autoComplete="off"
					className="fr-input"
					id="dev-login-siret"
					inputMode="numeric"
					type="text"
					{...form.register("siret")}
				/>
				{siretError && (
					<p className="fr-error-text" id="dev-login-siret-error">
						{siretError}
					</p>
				)}
			</div>

			{serverError && (
				<div className="fr-alert fr-alert--error fr-mb-2w">
					<p>{serverError}</p>
				</div>
			)}

			<button className="fr-btn" disabled={submitting} type="submit">
				Se connecter
			</button>
		</form>
	);
}
