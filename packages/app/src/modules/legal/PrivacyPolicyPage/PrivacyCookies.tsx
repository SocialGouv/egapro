import Link from "next/link";

import { NewTabNotice } from "~/modules/layout";

/** Cookie policy section. */
export function PrivacyCookies() {
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
