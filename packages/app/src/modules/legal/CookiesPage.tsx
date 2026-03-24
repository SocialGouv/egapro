import { Breadcrumb } from "~/modules/layout";

/** Gestion des cookies page. */
export function CookiesPage() {
	return (
		<main id="content" tabIndex={-1}>
			<div className="fr-container fr-py-6w">
				<Breadcrumb
					items={[
						{ label: "Accueil", href: "/" },
						{ label: "Gestion des cookies" },
					]}
				/>

				<h1 className="fr-h1 fr-mt-4w">Gestion des cookies</h1>

				<h2 className="fr-h4">Qu'est-ce qu'un cookie ?</h2>
				<p>
					Un cookie est un fichier déposé sur votre terminal lors de la visite
					d'un site. Il a pour but de collecter des informations relatives à
					votre navigation et de vous adresser des services adaptés à votre
					terminal (ordinateur, mobile ou tablette).
				</p>

				<h2 className="fr-h4">Cookies utilisés sur Index Egapro</h2>
				<p>
					Index Egapro utilise la solution de mesure d'audience « Matomo »,
					paramétrée en mode « exempté » conformément aux recommandations de la
					CNIL. Ce paramétrage ne nécessite pas le recueil de votre
					consentement.
				</p>
				<p>
					La durée de vie du cookie Matomo n'excède pas 13 mois. Les données
					collectées ne sont pas recoupées avec d'autres traitements et le
					cookie ne permet pas de suivre la navigation de l'internaute sur
					d'autres sites.
				</p>

				<h3 className="fr-h6">Cookies strictement nécessaires</h3>
				<p>
					Ces cookies sont indispensables au bon fonctionnement du site et ne
					peuvent pas être désactivés. Ils permettent notamment de gérer
					l'authentification et les préférences d'affichage.
				</p>
				<div className="fr-table">
					<table>
						<caption>Cookies strictement nécessaires</caption>
						<thead>
							<tr>
								<th scope="col">Cookie</th>
								<th scope="col">Finalité</th>
								<th scope="col">Durée de conservation</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>fr-theme</td>
								<td>Préférence de thème d'affichage (clair/sombre)</td>
								<td>1 an</td>
							</tr>
							<tr>
								<td>next-auth.session-token</td>
								<td>Authentification de l'utilisateur</td>
								<td>30 jours</td>
							</tr>
						</tbody>
					</table>
				</div>

				<h3 className="fr-h6">Cookies de mesure d'audience</h3>
				<div className="fr-table">
					<table>
						<caption>Cookies de mesure d'audience</caption>
						<thead>
							<tr>
								<th scope="col">Cookie</th>
								<th scope="col">Finalité</th>
								<th scope="col">Durée de conservation</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>_pk_id</td>
								<td>
									Identifiant unique généré par Matomo pour les statistiques de
									fréquentation
								</td>
								<td>13 mois</td>
							</tr>
							<tr>
								<td>_pk_ses</td>
								<td>
									Cookie de session Matomo pour le suivi des pages visitées
								</td>
								<td>30 minutes</td>
							</tr>
						</tbody>
					</table>
				</div>

				<h2 className="fr-h4">Comment désactiver les cookies ?</h2>
				<p>
					Vous pouvez à tout moment refuser l'utilisation des cookies et
					désactiver le dépôt sur votre ordinateur en utilisant la fonction
					dédiée de votre navigateur (fonction disponible notamment sur
					Microsoft Internet Explorer 11, Google Chrome, Mozilla Firefox, Apple
					Safari et Opera).
				</p>
				<p>
					La désactivation des cookies strictement nécessaires peut altérer le
					fonctionnement du site.
				</p>
			</div>
		</main>
	);
}
