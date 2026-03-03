import { NewTabNotice } from "~/modules/layout";

/** Déclaration d'accessibilité page (RGAA). */
export function AccessibilityPage() {
	return (
		<main id="content" tabIndex={-1}>
			<div className="fr-container fr-py-6w">
				<nav aria-label="vous êtes ici :" className="fr-breadcrumb">
					<button
						aria-controls="breadcrumb-accessibility"
						aria-expanded="false"
						className="fr-breadcrumb__button"
						type="button"
					>
						Voir le fil d'Ariane
					</button>
					<div className="fr-collapse" id="breadcrumb-accessibility">
						<ol className="fr-breadcrumb__list">
							<li>
								<a className="fr-breadcrumb__link" href="/">
									Accueil
								</a>
							</li>
							<li>
								<a
									aria-current="page"
									className="fr-breadcrumb__link"
									href="/declaration-accessibilite"
								>
									Déclaration d'accessibilité
								</a>
							</li>
						</ol>
					</div>
				</nav>

				<h1 className="fr-h1 fr-mt-4w">Déclaration d'accessibilité</h1>

				<p>
					La Direction générale du travail s'engage à rendre son service
					accessible, conformément à l'article 47 de la loi n° 2005-102 du 11
					février 2005.
				</p>

				<AccessibilityComplianceStatus />
				<AccessibilityTestResults />
				<AccessibilityNonAccessible />
				<AccessibilityEstablishment />
				<AccessibilityFeedback />
				<AccessibilityRecourse />
			</div>
		</main>
	);
}

function AccessibilityComplianceStatus() {
	return (
		<>
			<h2 className="fr-h4">État de conformité</h2>
			<p>
				Index Egapro est <strong>partiellement conforme</strong> avec le
				référentiel général d'amélioration de l'accessibilité (RGAA), version
				4.1, en raison des non-conformités et des dérogations énumérées
				ci-dessous.
			</p>
		</>
	);
}

function AccessibilityTestResults() {
	return (
		<>
			<h2 className="fr-h4">Résultats des tests</h2>
			<p>
				L'audit de conformité réalisé par la Direction générale du travail
				révèle que le site est conforme à 75 % au RGAA version 4.1.
			</p>
		</>
	);
}

function AccessibilityNonAccessible() {
	return (
		<>
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

function AccessibilityEstablishment() {
	return (
		<>
			<h2 className="fr-h4">Établissement de cette déclaration</h2>
			<p>
				Cette déclaration a été établie le 1er mars 2024. Elle a été mise à jour
				le 1er mars 2025.
			</p>
			<p>Technologies utilisées pour la réalisation du site :</p>
			<ul>
				<li>HTML5</li>
				<li>CSS</li>
				<li>JavaScript</li>
			</ul>
			<p>
				Environnement de test : les tests ont été effectués avec les
				combinaisons de navigateurs et technologies d'assistance suivantes :
			</p>
			<ul>
				<li>Firefox et NVDA</li>
				<li>Safari et VoiceOver</li>
			</ul>
			<p>Outils utilisés pour vérifier l'accessibilité :</p>
			<ul>
				<li>Axe DevTools</li>
				<li>Lighthouse</li>
				<li>WAVE</li>
			</ul>
		</>
	);
}

function AccessibilityFeedback() {
	return (
		<>
			<h2 className="fr-h4">Retour d'information et contact</h2>
			<p>
				Si vous n'arrivez pas à accéder à un contenu ou à un service, vous
				pouvez contacter le responsable du site pour être orienté vers une
				alternative accessible ou obtenir le contenu sous une autre forme.
			</p>
			<p>
				Contactez-nous à :{" "}
				<a href="mailto:index@travail.gouv.fr">index@travail.gouv.fr</a>
			</p>
		</>
	);
}

function AccessibilityRecourse() {
	return (
		<>
			<h2 className="fr-h4">Voie de recours</h2>
			<p>
				Cette procédure est à utiliser dans le cas suivant : vous avez signalé
				au responsable du site un défaut d'accessibilité qui vous empêche
				d'accéder à un contenu ou à un des services du portail et vous n'avez
				pas obtenu de réponse satisfaisante.
			</p>
			<p>Vous pouvez :</p>
			<ul>
				<li>
					Écrire un message au{" "}
					<a
						href="https://formulaire.defenseurdesdroits.fr/"
						rel="noopener noreferrer"
						target="_blank"
					>
						Défenseur des droits
						<NewTabNotice />
					</a>
				</li>
				<li>
					Contacter le délégué du{" "}
					<a
						href="https://www.defenseurdesdroits.fr/saisir/delegues"
						rel="noopener noreferrer"
						target="_blank"
					>
						Défenseur des droits dans votre région
						<NewTabNotice />
					</a>
				</li>
				<li>
					Envoyer un courrier par la poste (gratuit, ne pas mettre de timbre) à
					l'adresse suivante : Défenseur des droits, Libre réponse 71120, 75342
					Paris CEDEX 07
				</li>
			</ul>
		</>
	);
}
