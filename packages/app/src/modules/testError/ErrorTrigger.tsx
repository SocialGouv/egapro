"use client";

import { useState } from "react";

/** Client component with buttons to trigger client-side and server-side errors for Sentry testing. */
export function ErrorTrigger() {
	const [shouldThrow, setShouldThrow] = useState(false);
	const [serverResult, setServerResult] = useState<string | null>(null);

	if (shouldThrow) {
		throw new Error("Test error for 500 page integration testing");
	}

	const handleServerError = async () => {
		setServerResult(null);
		try {
			const response = await fetch("/api/test-sentry");
			const data = (await response.json()) as { error?: string };
			setServerResult(
				`Statut ${String(response.status)} — ${data.error ?? "Erreur envoyée à Sentry"}`,
			);
		} catch {
			setServerResult(
				"Erreur serveur déclenchée — vérifiez le tableau de bord Sentry",
			);
		}
	};

	return (
		<main id="content" tabIndex={-1}>
			<div className="fr-container fr-my-7w">
				<h1>Test erreur 500</h1>
				<p className="fr-text--sm fr-mb-3w">
					Cliquez sur le bouton pour déclencher une erreur et afficher la page
					500.
				</p>
				<button
					className="fr-btn"
					onClick={() => setShouldThrow(true)}
					type="button"
				>
					Déclencher une erreur client
				</button>

				<h2 className="fr-mt-5w">Test erreur serveur (API)</h2>
				<p className="fr-text--sm fr-mb-3w">
					Appelle l'API <code>/api/test-sentry</code> pour déclencher une erreur
					côté serveur captée par Sentry.
				</p>
				<button
					className="fr-btn fr-btn--secondary"
					onClick={handleServerError}
					type="button"
				>
					Tester une erreur serveur (API)
				</button>
				<output className="fr-mt-2w fr-text--sm fr-displayed-block">
					{serverResult}
				</output>
			</div>
		</main>
	);
}
