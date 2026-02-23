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
						<span className="fr-notice__title">Egapro evolves&nbsp;:</span>
						<span className="fr-notice__desc">
							The portal now integrates the new European directives on pay
							equality.
						</span>
						<a
							className="fr-notice__link"
							href="/actualites"
							rel="noopener noreferrer"
							title="Learn more - new window"
						>
							Learn more
						</a>
					</p>
					<button
						className="fr-btn--close fr-btn"
						onClick={() => setDismissed(true)}
						title="Hide message"
						type="button"
					>
						Hide message
					</button>
				</div>
			</div>
		</div>
	);
}
