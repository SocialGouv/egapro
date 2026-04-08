"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { impersonateSearchSchema } from "~/modules/admin/schemas";
import { useZodForm } from "~/modules/shared/useZodForm";
import { api } from "~/trpc/react";

import { CompanyPreviewCard } from "./CompanyPreviewCard";

type SearchResult = {
	siren: string;
	name: string;
	address: string | null;
	nafCode: string | null;
	workforce: number | null;
};

/**
 * Search + preview + start/stop impersonation.
 *
 * Flow:
 *   1. admin types SIREN → `admin.searchCompany` query resolves it
 *   2. preview card is shown, "Valider" starts the audit log + mutates
 *      the NextAuth JWT via `session.update({ impersonation: ... })`
 *   3. on success, redirect to `/mon-espace` where the banner is shown
 *      globally.
 */
export function ImpersonateForm() {
	const session = useSession();
	const router = useRouter();
	const [preview, setPreview] = useState<SearchResult | null>(null);
	const [serverError, setServerError] = useState<string | null>(null);

	const form = useZodForm(impersonateSearchSchema, {
		defaultValues: { siren: "" },
	});

	const lastImpersonated = api.admin.getLastImpersonated.useQuery(undefined, {
		// only useful for logged-in admins, matches the procedure guard
		enabled: session.data?.user.isAdmin === true,
	});

	const searchMutation = api.admin.searchCompany.useMutation({
		onSuccess: (data) => {
			setPreview(data);
			setServerError(null);
		},
		onError: (err) => {
			setPreview(null);
			setServerError(err.message);
		},
	});

	const startMutation = api.admin.startImpersonate.useMutation({
		onSuccess: async (data) => {
			await session.update({ impersonation: data });
			router.push("/mon-espace");
		},
		onError: (err) => setServerError(err.message),
	});

	const stopMutation = api.admin.stopImpersonate.useMutation({
		onSuccess: async () => {
			await session.update({ impersonation: null });
			router.refresh();
		},
	});

	const onSearch = form.handleSubmit((values) => {
		searchMutation.mutate(values);
	});

	const onStart = () => {
		if (preview) startMutation.mutate({ siren: preview.siren });
	};

	const isImpersonating = Boolean(session.data?.user.impersonation);
	const sirenError = form.formState.errors.siren?.message;

	return (
		<div className="fr-mt-4w">
			{isImpersonating && (
				<section
					aria-label="Mimoquage en cours"
					className="fr-alert fr-alert--info fr-mb-2w"
				>
					<p className="fr-alert__title">Mimoquage en cours</p>
					<p>
						Vous êtes actuellement sous l'identité de l'entreprise{" "}
						<strong>{session.data?.user.impersonation?.name}</strong> (
						{session.data?.user.impersonation?.siren}).
					</p>
				</section>
			)}

			<form noValidate onSubmit={onSearch}>
				<div
					className={
						sirenError
							? "fr-input-group fr-input-group--error"
							: "fr-input-group"
					}
				>
					<label className="fr-label" htmlFor="impersonate-siren">
						SIREN de l'entreprise
					</label>
					<input
						aria-describedby={
							sirenError ? "impersonate-siren-error" : undefined
						}
						autoComplete="off"
						className="fr-input"
						id="impersonate-siren"
						inputMode="numeric"
						list="impersonate-siren-list"
						type="text"
						{...form.register("siren")}
					/>
					<datalist id="impersonate-siren-list">
						{(lastImpersonated.data ?? []).map((c) => (
							<option key={c.siren} value={c.siren}>
								{c.name}
							</option>
						))}
					</datalist>
					{sirenError && (
						<p
							aria-live="polite"
							className="fr-error-text"
							id="impersonate-siren-error"
						>
							{sirenError}
						</p>
					)}
				</div>

				<ul className="fr-btns-group fr-btns-group--inline-sm">
					<li>
						<button
							className="fr-btn"
							disabled={searchMutation.isPending}
							type="submit"
						>
							Rechercher
						</button>
					</li>
					{isImpersonating && (
						<li>
							<button
								className="fr-btn fr-btn--secondary"
								disabled={stopMutation.isPending}
								onClick={() => stopMutation.mutate()}
								type="button"
							>
								Arrêter le mimoquage
							</button>
						</li>
					)}
				</ul>
			</form>

			{serverError && (
				<div
					aria-live="polite"
					className="fr-alert fr-alert--error fr-mt-2w"
					role="alert"
				>
					<p>{serverError}</p>
				</div>
			)}

			{preview && (
				<>
					<CompanyPreviewCard company={preview} />
					<ul className="fr-btns-group fr-btns-group--inline-sm fr-mt-2w">
						<li>
							<button
								className="fr-btn"
								disabled={startMutation.isPending}
								onClick={onStart}
								type="button"
							>
								Valider et mimoquer
							</button>
						</li>
					</ul>
				</>
			)}
		</div>
	);
}
