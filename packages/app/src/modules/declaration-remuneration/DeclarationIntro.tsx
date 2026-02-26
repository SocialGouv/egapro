import Link from "next/link";

export function DeclarationIntro() {
	return (
		<div className="fr-container fr-my-4w">
			<div className="fr-grid-row fr-grid-row--center">
				<div className="fr-col-12 fr-col-md-8">
					<h1>Déclarer les indicateurs de rémunération</h1>
					<p className="fr-text--lg">
						Ce parcours vous permet de déclarer les indicateurs relatifs aux
						écarts de rémunération entre les femmes et les hommes dans votre
						entreprise pour l'année en cours.
					</p>
					<p>Vous allez renseigner les informations suivantes en 6 étapes :</p>
					<ol>
						<li>Effectifs physiques de votre entreprise par catégorie</li>
						<li>Écart de rémunération entre les femmes et les hommes</li>
						<li>Écart de rémunération variable ou complémentaire</li>
						<li>
							Proportion de femmes et d'hommes dans chaque quartile de
							rémunération
						</li>
						<li>Indicateur par catégories de salariés</li>
						<li>Vérification et soumission de la déclaration</li>
					</ol>
					<Link
						className="fr-btn fr-btn--lg"
						href="/declaration-remuneration/etape/1"
					>
						Commencer
					</Link>
				</div>
			</div>
		</div>
	);
}
