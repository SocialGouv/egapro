"use client";

export function DraftLoadingState() {
	return (
		<div aria-busy="true" aria-live="polite" className="fr-py-4w" role="status">
			<p className="fr-mb-0 fr-text-mention--grey">
				Chargement du brouillon en cours…
			</p>
		</div>
	);
}
