"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

import { impersonateSearchSchema } from "~/modules/admin/schemas";
import { useZodForm } from "~/modules/shared/useZodForm";
import { api } from "~/trpc/react";

import { CompanyPreviewCard } from "./CompanyPreviewCard";

/**
 * Search + preview + start/stop impersonation.
 *
 * The impersonation state is stored in the NextAuth JWT. Starting is a
 * single `session.update({ impersonation: { siren, name } })` call: the
 * server-side `jwt` callback writes the audit row and mutates the token
 * atomically. Stopping is the same call with `null`.
 */
export function ImpersonateForm() {
	const session = useSession();
	const router = useRouter();
	const [serverError, setServerError] = useState<string | null>(null);
	const [starting, setStarting] = useState(false);

	const form = useZodForm(impersonateSearchSchema, {
		defaultValues: { siren: "" },
	});

	const lastImpersonated = api.admin.getLastImpersonated.useQuery(undefined, {
		enabled: session.data?.user.isAdmin === true,
	});

	const searchMutation = api.admin.searchCompany.useMutation({
		onSuccess: () => setServerError(null),
		onError: (err) => setServerError(err.message),
	});

	const preview = searchMutation.data ?? null;

	const onSearch = form.handleSubmit((values) => {
		searchMutation.mutate(values);
	});

	const onStart = async () => {
		if (!preview) return;
		setStarting(true);
		try {
			await session.update({
				impersonation: { siren: preview.siren, name: preview.name },
			});
			router.push("/mon-espace");
		} finally {
			setStarting(false);
		}
	};

	const sirenError = form.formState.errors.siren?.message;

	return (
		<div className="fr-mt-4w">
			<form autoComplete="off" noValidate onSubmit={onSearch}>
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
						aria-invalid={Boolean(sirenError)}
						aria-required="true"
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
						<p className="fr-error-text" id="impersonate-siren-error">
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
				</ul>
			</form>

			{serverError && (
				<div className="fr-alert fr-alert--error fr-mt-2w" role="alert">
					<h3 className="fr-alert__title">Erreur</h3>
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
								disabled={starting}
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
