export function CampaignRateTileLoading() {
	return (
		<p aria-live="polite" className="fr-text--sm">
			Chargement du taux de déclaration…
		</p>
	);
}

export function CampaignRateTileError() {
	return (
		<div className="fr-alert fr-alert--error" role="alert">
			<p>Une erreur est survenue lors du chargement du taux de déclaration.</p>
		</div>
	);
}
