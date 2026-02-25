"use client";

import { useState } from "react";

/** Important information banner, dismissable (fr-notice--info). */
export function HomeNotice() {
	const [dismissed, setDismissed] = useState(false);

	if (dismissed) return null;

	return (
		<div className="fr-notice fr-notice--info">
			<div className="fr-container">
				<div className="fr-notice__body">
					<p>
						<span className="fr-notice__title">Egapro évolue&nbsp;:</span>
						<span className="fr-notice__desc">
							Le portail intègre désormais les nouvelles directives européennes
							sur l&apos;égalité salariale.
						</span>
						<a className="fr-notice__link" href="/actualites">
							En savoir plus
						</a>
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
