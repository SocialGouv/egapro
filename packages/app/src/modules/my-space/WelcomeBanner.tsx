"use client";

import { useState } from "react";

export function WelcomeBanner() {
	const [dismissed, setDismissed] = useState(false);

	if (dismissed) return null;

	return (
		<div className="fr-alert fr-alert--info fr-mb-4w">
			<h3 className="fr-alert__title">Bienvenue sur votre espace Egapro</h3>
			<p>
				Vos informations professionnelles et personnelles ont été renseignées
				automatiquement via ProConnect.
			</p>
			<button
				className="fr-btn--close fr-btn"
				onClick={() => setDismissed(true)}
				title="Masquer le message"
				type="button"
			>
				Masquer le message
			</button>
		</div>
	);
}
