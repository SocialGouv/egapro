"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

/**
 * Global banner shown on every page when an admin is currently
 * impersonating a company. Lets them return to their own account in one
 * click from anywhere in the app.
 *
 * The impersonation state lives entirely in the NextAuth JWT — stopping
 * it is a single `session.update({ impersonation: null })` call, which
 * the server-side `jwt` callback handles (clearing the token and closing
 * the audit event).
 */
export function ImpersonateBanner() {
	const session = useSession();
	const router = useRouter();

	const impersonation = session.data?.user.impersonation;
	if (!impersonation) return null;

	const onStop = async () => {
		await session.update({ impersonation: null });
		router.refresh();
	};

	return (
		<div className="fr-notice fr-notice--info">
			<div className="fr-container">
				<div className="fr-notice__body">
					<p>
						<span className="fr-notice__title">
							Vous mimoquez l'entreprise {impersonation.name} (
							{impersonation.siren}).
						</span>
					</p>
					<button
						className="fr-btn--close fr-btn"
						onClick={onStop}
						title="Arrêter le mimoquage"
						type="button"
					>
						Arrêter le mimoquage
					</button>
				</div>
			</div>
		</div>
	);
}
