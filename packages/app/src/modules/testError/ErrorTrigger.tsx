"use client";

import { useState } from "react";

/** Client component with a button to trigger a 500 error and display the error page. */
export function ErrorTrigger() {
	const [shouldThrow, setShouldThrow] = useState(false);

	if (shouldThrow) {
		throw new Error("Test error for 500 page integration testing");
	}

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
					Déclencher une erreur 500
				</button>
			</div>
		</main>
	);
}
