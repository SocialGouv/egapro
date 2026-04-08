"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { api } from "~/trpc/react";

/**
 * Global banner shown on every page when an admin is currently
 * impersonating a company. Lets them return to their own account in one
 * click from anywhere in the app.
 *
 * Rendered near the top of `<body>` — the `fr-notice` DSFR component is
 * picked because it survives layout changes across the whole app.
 */
export function ImpersonateBanner() {
	const session = useSession();
	const router = useRouter();

	const stopMutation = api.admin.stopImpersonate.useMutation({
		onSuccess: async () => {
			await session.update({ impersonation: null });
			router.refresh();
		},
	});

	const impersonation = session.data?.user.impersonation;
	if (!impersonation) return null;

	return (
		<section
			aria-label="Mimoquage en cours"
			className="fr-notice fr-notice--info"
		>
			<div className="fr-container">
				<div className="fr-notice__body">
					<p>
						<span className="fr-notice__title">
							Vous mimoquez l'entreprise {impersonation.name} (
							{impersonation.siren}).
						</span>
					</p>
					<button
						className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm"
						disabled={stopMutation.isPending}
						onClick={() => stopMutation.mutate()}
						type="button"
					>
						Arrêter le mimoquage
					</button>
				</div>
			</div>
		</section>
	);
}
