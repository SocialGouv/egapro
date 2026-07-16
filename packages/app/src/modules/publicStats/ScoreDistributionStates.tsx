export function ScoreDistributionLoading() {
	return (
		<p aria-live="polite" className="fr-text--sm fr-mt-6w">
			Chargement de la distribution des scores…
		</p>
	);
}

export function ScoreDistributionTileError() {
	return (
		<div className="fr-alert fr-alert--error fr-mt-6w" role="alert">
			<p>
				Une erreur est survenue lors du chargement de la distribution des
				scores.
			</p>
		</div>
	);
}
