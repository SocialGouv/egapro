import { Breadcrumb, NewTabNotice } from "~/modules/layout";

/** Mentions légales page. */
export function LegalNoticePage() {
	return (
		<main id="content" tabIndex={-1}>
			<div className="fr-container fr-py-6w">
				<Breadcrumb
					items={[
						{ label: "Accueil", href: "/" },
						{ label: "Mentions légales" },
					]}
				/>

				<h1 className="fr-h1 fr-mt-4w">Mentions légales</h1>

				<h2 className="fr-h4">Éditeur de la plateforme</h2>
				<p>Le site est édité par la Direction générale du travail située :</p>
				<p className="fr-mb-3w">
					14 Avenue Duquesne
					<br />
					SP 07
					<br />
					75350 Paris
				</p>

				<h2 className="fr-h4">Directeur de la publication</h2>
				<p>Pierre RAMAIN, directeur général du travail</p>

				<h2 className="fr-h4">Hébergement de la plateforme</h2>
				<p>La plateforme est hébergée par OVH, situé :</p>
				<p className="fr-mb-3w">
					2 rue Kellermann
					<br />
					59100 Roubaix
					<br />
					France
				</p>

				<h2 className="fr-h4">Accessibilité</h2>
				<p>
					Index Egapro est partiellement conforme avec le référentiel général
					d'amélioration de l'accessibilité (RGAA), version 4.1. Pour en savoir
					plus, consultez notre{" "}
					<a href="/declaration-accessibilite">déclaration d'accessibilité</a>.
				</p>

				<h3 className="fr-h6">Signaler un dysfonctionnement</h3>
				<p>
					Si vous rencontrez un défaut d'accessibilité vous empêchant d'accéder
					à un contenu ou une fonctionnalité du site, merci de nous en faire
					part via{" "}
					<a href="mailto:index@travail.gouv.fr">index@travail.gouv.fr</a>.
				</p>
				<p>
					Si vous n'obtenez pas de réponse rapide de notre part, vous êtes en
					droit de faire parvenir vos doléances ou une demande de saisine au
					Défenseur des droits.
				</p>

				<h3 className="fr-h6">En savoir plus</h3>
				<p>
					Pour en savoir plus sur la politique d'accessibilité numérique de
					l'État :{" "}
					<a
						href="https://accessibilite.numerique.gouv.fr/"
						rel="noopener noreferrer"
						target="_blank"
					>
						accessibilite.numerique.gouv.fr
						<NewTabNotice />
					</a>
				</p>

				<h2 className="fr-h4">Sécurité</h2>
				<p>
					La plateforme est protégée par un certificat électronique, matérialisé
					pour la grande majorité des navigateurs par un cadenas. Cette
					protection participe à la confidentialité des échanges.
				</p>
			</div>
		</main>
	);
}
