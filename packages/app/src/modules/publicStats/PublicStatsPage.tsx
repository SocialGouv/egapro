import { CurrentCampaignRateTile } from "./CurrentCampaignRateTile";
import { ScoreDistributionTile } from "./ScoreDistributionTile";

export function PublicStatsPage() {
	return (
		<main className="fr-container fr-py-6w" id="content" tabIndex={-1}>
			<h1 className="fr-h1">Statistiques publiques</h1>
			<p className="fr-text--lead fr-mb-4w">
				Indicateurs clés sur l'égalité professionnelle femmes-hommes en France.
			</p>
			<CurrentCampaignRateTile />
			<ScoreDistributionTile />
		</main>
	);
}
