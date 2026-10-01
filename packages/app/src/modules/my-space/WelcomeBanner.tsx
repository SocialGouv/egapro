"use client";

import { useState } from "react";

export function WelcomeBanner() {
	const [dismissed, setDismissed] = useState(false);

	if (dismissed) return null;

	return (
		<div className="fr-notice fr-notice--info">
			<div className="fr-container">
				<div className="fr-notice__body">
					<p>
						<span className="fr-notice__title">
							Bienvenue sur votre espace Egapro
						</span>
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
			</div>
		</div>
	);
}
