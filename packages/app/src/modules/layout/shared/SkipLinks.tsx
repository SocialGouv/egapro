/**
 * Liens d'évitement (skip links) — obligatoires RGAA critère 12.7.
 * Permettent aux utilisateurs clavier/lecteur d'écran de sauter
 * directement au contenu principal ou au pied de page.
 */
export function SkipLinks() {
	return (
		<div className="fr-skiplinks">
			<nav aria-label="Accès rapide" className="fr-container">
				<ul className="fr-skiplinks__list">
					<li>
						<a className="fr-link" href="#content">
							Contenu
						</a>
					</li>
					<li>
						<a className="fr-link" href="#footer">
							Pied de page
						</a>
					</li>
				</ul>
			</nav>
		</div>
	);
}
