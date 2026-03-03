/** Compliance status, test results, and non-accessible content. */
export function AccessibilityCompliance() {
	return (
		<>
			<h2 className="fr-h4">État de conformité</h2>
			<p>
				Index Egapro est <strong>partiellement conforme</strong> avec le
				référentiel général d'amélioration de l'accessibilité (RGAA), version
				4.1, en raison des non-conformités et des dérogations énumérées
				ci-dessous.
			</p>

			<h2 className="fr-h4">Résultats des tests</h2>
			<p>
				L'audit de conformité réalisé par la Direction générale du travail
				révèle que le site est conforme à 75 % au RGAA version 4.1.
			</p>

			<h2 className="fr-h4">Contenus non accessibles</h2>
			<p>
				Les contenus listés ci-dessous ne sont pas accessibles pour les raisons
				suivantes :
			</p>
			<h3 className="fr-h6">Non-conformités</h3>
			<ul>
				<li>
					Certaines images porteuses d'information n'ont pas d'alternative
					textuelle suffisamment détaillée ;
				</li>
				<li>
					Certains contrastes de couleurs sont insuffisants pour les textes de
					petite taille ;
				</li>
				<li>
					Certains formulaires n'ont pas de labels explicitement associés à
					leurs champs.
				</li>
			</ul>
			<h3 className="fr-h6">Dérogations pour charge disproportionnée</h3>
			<p>Aucune dérogation n'est revendiquée.</p>
			<h3 className="fr-h6">
				Contenus non soumis à l'obligation d'accessibilité
			</h3>
			<p>Aucun contenu n'est exclu.</p>
		</>
	);
}
