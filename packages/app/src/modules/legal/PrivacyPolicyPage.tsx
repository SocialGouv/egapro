import Link from "next/link";

import { NewTabNotice } from "~/modules/layout";

/** Données personnelles / politique de confidentialité page. */
export function PrivacyPolicyPage() {
	return (
		<main id="content" tabIndex={-1}>
			<div className="fr-container fr-py-6w">
				<nav aria-label="vous êtes ici :" className="fr-breadcrumb">
					<button
						aria-controls="breadcrumb-privacy"
						aria-expanded="false"
						className="fr-breadcrumb__button"
						type="button"
					>
						Voir le fil d'Ariane
					</button>
					<div className="fr-collapse" id="breadcrumb-privacy">
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
									href="/donnees-personnelles"
								>
									Données personnelles
								</a>
							</li>
						</ol>
					</div>
				</nav>

				<h1 className="fr-h1 fr-mt-4w">Données personnelles</h1>

				<PrivacyResponsible />
				<PrivacyDataProcessed />
				<PrivacyPurpose />
				<PrivacyLegalBasis />
				<PrivacyRetention />
				<PrivacyRights />
				<PrivacyAccess />
				<PrivacySubprocessors />
				<PrivacyCookies />
			</div>
		</main>
	);
}

function PrivacyResponsible() {
	return (
		<>
			<h2 className="fr-h4">Qui est responsable d'Index Egapro ?</h2>
			<p>
				La plateforme Index Egapro relève de la Direction générale du travail,
				représentée par Monsieur Pierre RAMAIN, directeur général du travail.
				Index Egapro met en place deux index conçus pour lutter contre
				l'inégalité entre les femmes et les hommes.
			</p>
		</>
	);
}

function PrivacyDataProcessed() {
	return (
		<>
			<h2 className="fr-h4">
				Quelles sont les données à caractère personnel que nous traitons ?
			</h2>
			<p>Index Egapro traite les données à caractère personnel suivantes :</p>
			<ul>
				<li>
					Nom, prénom, adresse e-mail et numéro de téléphone professionnel des
					utilisateurs.
				</li>
			</ul>
		</>
	);
}

function PrivacyPurpose() {
	return (
		<>
			<h2 className="fr-h4">
				Pourquoi traitons-nous des données à caractère personnel ?
			</h2>
			<p>Index Egapro traite des données à caractère personnel pour :</p>
			<ul>
				<li>
					Calculer les écarts de rémunération entre les femmes et les hommes au
					sein des entreprises et réaliser les déclarations qui en sont issues ;
				</li>
				<li>
					Calculer les écarts de représentation équilibrée entre les femmes et
					les hommes dans les services dirigeants.
				</li>
			</ul>
		</>
	);
}

function PrivacyLegalBasis() {
	return (
		<>
			<h2 className="fr-h4">
				Qu'est-ce qui nous autorise à traiter des données à caractère personnel
				?
			</h2>
			<p>
				Index Egapro traite des données à caractère personnel en se basant sur
				l'exécution d'une mission d'intérêt public ou relevant de l'exercice de
				l'autorité publique dont est investi le responsable de traitement
				conformément à l'article 6-1 e) du RGPD.
			</p>
		</>
	);
}

function PrivacyRetention() {
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
		</>
	);
}

function PrivacyRights() {
	return (
		<>
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
		</>
	);
}

function PrivacyAccess() {
	return (
		<>
			<h2 className="fr-h4">Qui va avoir accès aux données ?</h2>
			<p>
				Les accès aux données sont strictement encadrés et juridiquement
				justifiés. Les personnes suivantes vont avoir accès aux données :
			</p>
			<ul>
				<li>Les membres de l'équipe d'Index Egapro.</li>
			</ul>
		</>
	);
}

function PrivacySubprocessors() {
	return (
		<>
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

function PrivacyCookies() {
	return (
		<>
			<h2 className="fr-h4">Cookies</h2>
			<p>
				Un cookie est un fichier déposé sur votre terminal lors de la visite
				d'un site. Il a pour but de collecter des informations relatives à votre
				navigation et de vous adresser des services adaptés à votre terminal
				(ordinateur, mobile ou tablette).
			</p>
			<p>
				En application de l'article 5(3) de la directive 2002/58/CE modifiée
				concernant le traitement des données à caractère personnel et la
				protection de la vie privée dans le secteur des communications
				électroniques, transposée à l'article 82 de la loi n° 78-17 du 6 janvier
				1978 relative à l'informatique, aux fichiers et aux libertés, les
				traceurs ou cookies suivent deux régimes distincts.
			</p>
			<p>
				Les cookies strictement nécessaires au service ou ayant pour finalité
				exclusive de faciliter la communication par voie électronique sont
				dispensés de consentement préalable au titre de l'article 82 de la loi
				n° 78-17 du 6 janvier 1978.
			</p>
			<p>
				Les cookies n'étant pas strictement nécessaires au service ou n'ayant
				pas pour finalité exclusive de faciliter la communication par voie
				électronique doivent être consentis par l'utilisateur.
			</p>
			<p>
				Ce consentement de la personne concernée pour une ou plusieurs finalités
				spécifiques constitue une base légale au sens du RGPD et doit être
				entendu au sens de l'article 6-1 a) du RGPD.
			</p>
			<p>
				Index Egapro utilise notamment la solution de mesure d'audience « Matomo
				» paramétrée en mode « exempté » et ne nécessitant pas le recueil de
				votre consentement conformément aux recommandations de la CNIL. La durée
				de vie du cookie n'excède pas 13 mois.
			</p>
			<p>
				Pour en savoir plus sur la gestion des cookies, consultez notre page{" "}
				<Link href="/gestion-des-cookies">Gestion des cookies</Link>.
			</p>
			<p>
				À tout moment, vous pouvez refuser l'utilisation des cookies et
				désactiver le dépôt sur votre ordinateur en utilisant la fonction dédiée
				de votre navigateur (fonction disponible notamment sur Microsoft
				Internet Explorer 11, Google Chrome, Mozilla Firefox, Apple Safari et
				Opera).
			</p>
			<p>
				Pour aller plus loin, vous pouvez consulter les fiches proposées par la
				Commission Nationale de l'Informatique et des Libertés (CNIL) :
			</p>
			<ul>
				<li>
					<a
						href="https://www.cnil.fr/fr/cookies-traceurs-que-dit-la-loi"
						rel="noopener noreferrer"
						target="_blank"
					>
						Cookies &amp; traceurs : que dit la loi ?
						<NewTabNotice />
					</a>
				</li>
				<li>
					<a
						href="https://www.cnil.fr/fr/cookies-les-outils-pour-les-maitriser"
						rel="noopener noreferrer"
						target="_blank"
					>
						Cookies : les outils pour les maîtriser
						<NewTabNotice />
					</a>
				</li>
			</ul>
		</>
	);
}
