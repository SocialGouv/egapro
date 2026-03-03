import { NewTabNotice } from "~/modules/layout";

/** Data retention, user rights, data access, and subprocessors. */
export function PrivacyRightsAndData() {
	return (
		<>
			<h2 className="fr-h4">
				Pendant combien de temps les données à caractère personnel sont
				conservées ?
			</h2>
			<div className="fr-table">
				<table>
					<caption>Durée de conservation des données personnelles</caption>
					<thead>
						<tr>
							<th scope="col">Catégorie de données</th>
							<th scope="col">Durée de conservation</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>Données des utilisateurs des Index Egapro</td>
							<td>
								À compter de la suppression par l'utilisateur ou 2 ans à compter
								de la dernière déclaration ou de l'inactivité du compte
							</td>
						</tr>
					</tbody>
				</table>
			</div>

			<h2 className="fr-h4">Quels sont vos droits ?</h2>
			<p>Vous disposez :</p>
			<ul>
				<li>D'un droit d'information et d'un droit d'accès à vos données ;</li>
				<li>D'un droit de rectification ;</li>
				<li>D'un droit d'opposition ;</li>
				<li>D'un droit à la limitation du traitement.</li>
			</ul>
			<p>
				Pour les exercer, contactez-nous à :{" "}
				<a href="mailto:index@travail.gouv.fr">index@travail.gouv.fr</a>.
			</p>
			<p>
				Puisque ce sont des droits personnels, nous ne traiterons votre demande
				que si nous sommes en mesure de vous identifier. Ainsi, nous pourrons
				être amenés à vous demander la communication d'une preuve de votre
				identité.
			</p>
			<p>
				Pour vous aider dans votre démarche, vous trouverez un modèle de
				courrier élaboré par la CNIL ici :{" "}
				<a
					href="https://www.cnil.fr/fr/modele/courrier/exercer-son-droit-dacces"
					rel="noopener noreferrer"
					target="_blank"
				>
					exercer son droit d'accès
					<NewTabNotice />
				</a>
			</p>
			<p>
				Nous nous engageons à vous répondre dans un délai raisonnable qui ne
				saurait dépasser 1 mois à compter de la réception de votre demande.
			</p>

			<h2 className="fr-h4">Qui va avoir accès aux données ?</h2>
			<p>
				Les accès aux données sont strictement encadrés et juridiquement
				justifiés. Les personnes suivantes vont avoir accès aux données :
			</p>
			<ul>
				<li>Les membres de l'équipe d'Index Egapro.</li>
			</ul>

			<h2 className="fr-h4">Qui nous aide à traiter vos données ?</h2>
			<p>
				Certaines données sont envoyées à des sous-traitants. Nous nous sommes
				assurés qu'ils respectent les dispositions du RGPD et qu'ils apportent
				des garanties suffisantes en matière de sécurité et de confidentialité.
			</p>
			<div className="fr-table">
				<table>
					<caption>Liste des sous-traitants</caption>
					<thead>
						<tr>
							<th scope="col">Sous-traitant</th>
							<th scope="col">Traitement réalisé</th>
							<th scope="col">Pays destinataire</th>
							<th scope="col">Garanties</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>OVH</td>
							<td>Hébergement</td>
							<td>France</td>
							<td>
								<a
									href="https://www.ovhcloud.com/fr/personal-data-protection/"
									rel="noopener noreferrer"
									target="_blank"
								>
									Protection des données OVH
									<NewTabNotice />
								</a>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</>
	);
}
