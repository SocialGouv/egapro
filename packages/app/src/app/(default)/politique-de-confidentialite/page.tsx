import { Container, Grid, GridCol } from "@design-system";
import Link from "next/link";

import { FooterConsentManagementItem } from "../../consentManagement";

const title = "Politique de confidentialité";

export const metadata = {
  title,
  openGraph: {
    title,
  },
};

const PrivacyPolicy = () => {
  return (
    <section>
      <Container py="8w">
        <Grid align="center">
          <GridCol md={10} lg={8}>
            <h1>{title}</h1>
            <h2>Qui est responsable d’Index Egapro&nbsp;?</h2>
            <p>
              La plateforme Index Egapro est sous la responsabilité de la Direction générale du travail, représentée par
              Monsieur Pierre RAMAIN, directeur général du travail. Index Egapro met en place deux index conçus pour
              lutter contre l’inégalité entre les femmes et les hommes.
            </p>
            <h2>Quelles sont les données à caractère personnel que nous traitons&nbsp;?</h2>
            <p>Index Egapro traite les données à caractère personnel suivantes&nbsp;:</p>
            <ul className={"fr-mb-3w"}>
              <li>Nom, prénom, adresse e-mail et numéro de téléphone professionnel des utilisateurs.</li>
            </ul>
            <h2>Pourquoi traitons-nous des données à caractère personnel&nbsp;?</h2>
            <p>Index Egapro traite des données à caractère personnel pour&nbsp;:</p>
            <ul className={"fr-mb-3w"}>
              <li>
                Calculer les écarts de rémunération entre les femmes et les hommes au sein des entreprises et réaliser
                les déclarations qui en sont issues&nbsp;;
              </li>
              <li>
                Calculer les écarts de représentation équilibrée entre les femmes et les hommes dans les services
                dirigeants.
              </li>
            </ul>
            <h2>Qu’est-ce qui nous autorise à traiter des données à caractère personnel&nbsp;?</h2>
            <p>
              Index Egapro traite des données à caractère personnel en se basant sur l’exécution d’une mission d’intérêt
              public ou relevant de l’exercice de l’autorité publique dont est investi le responsable de traitement
              conformément à l’article 6-1 e) du RGPD.
            </p>
            <h2>Pendant combien de temps les données à caractère personnel sont conservées&nbsp;?</h2>
            <table className="fr-table fr-table--bordered">
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
                    À compter de la suppression par l’utilisateur ou 2 ans à compter de la dernière déclaration ou de
                    l’inactivité du compte
                  </td>
                </tr>
              </tbody>
            </table>
            <h2>Quels sont vos droits&nbsp;?</h2>
            <p>Vous disposez&nbsp;: </p>
            <ul className={"fr-mb-3w"}>
              <li>D’un droit d’information et d’un droit d’accès à vos données&nbsp;;</li>
              <li>D’un droit de rectification&nbsp;;</li>
              <li>D’un droit d’opposition&nbsp;;</li>
              <li>D’un droit à la limitation du traitement.</li>
            </ul>
            <p>
              Pour les exercer, contactez-nous à&nbsp;:{" "}
              <Link href="mailto:index@travail.gouv.fr">index@travail.gouv.fr</Link>.
            </p>
            <p>
              Puisque ce sont des droits personnels, nous ne traiterons votre demande que si nous sommes en mesure de
              vous identifier. Ainsi, nous pourrons être amenés à vous demander la communication d’une preuve de votre
              identité.
            </p>
            <p>
              Pour vous aider dans votre démarche, vous trouverez un modèle de courrier élaboré par la CNIL ici&nbsp;:{" "}
              <Link
                href={"https://www.cnil.fr/fr/modele/courrier/exercer-son-droit-dacces"}
                target="_blank"
                rel="noreferrer"
              >
                https://www.cnil.fr/fr/modele/courrier/exercer-son-droit-dacces
              </Link>
            </p>
            <p>
              Nous nous engageons à vous répondre dans un délai raisonnable qui ne saurait dépasser 1 mois à compter de
              la réception de votre demande.
            </p>
            <h2>Qui va avoir accès aux données&nbsp;?</h2>
            <p>
              Les accès aux données sont strictement encadrés et juridiquement justifiés. Les personnes suivantes vont
              avoir accès aux données&nbsp;:
              <ul className={"fr-mb-3w"}>
                <li>Les membres de l’équipe d’Index Egapro.</li>
              </ul>
            </p>
            <h2>Qui nous aide à traiter vos données&nbsp;?</h2>
            <p>
              Certaines données sont envoyées à des sous-traitants. Nous nous sommes assurés qu’ils respectent les
              dispositions du RGPD et qu’ils apportent des garanties suffisantes en matière de sécurité et de
              confidentialité.
            </p>
            <table className="fr-table fr-table--bordered">
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
                    <Link
                      href="https://storage.gra.cloud.ovh.net/v1/AUTH_325716a587c64897acbef9a4a4726e38/contracts/9e74492-OVH_Data_Protection_Agreement-FR-6.0.pdf"
                      target="_blank"
                      rel="noreferrer"
                    >
                      https://storage.gra.cloud.ovh.net/v1
                      <br />
                      /AUTH_325716a587c64897acbef9a4a4726e38
                      <br />
                      /contracts/9e74492-OVH_Data_Protection_Agreement-FR-6.0.pdf
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
            <h2>Cookies</h2>
            <p>
              Un cookie est un fichier déposé sur votre terminal lors de la visite d’un site. Il a pour but de collecter
              des informations relatives à votre navigation et de vous adresser des services adaptés à votre terminal
              (ordinateur, mobile ou tablette).
            </p>
            <p>
              En application de l’article 5(3) de la directive 2002/58/CE modifiée concernant le traitement des données
              à caractère personnel et la protection de la vie privée dans le secteur des communications électroniques,
              transposée à l’article 82 de la loi n° 78-17 du 6 janvier 1978 relative à l’informatique, aux fichiers et
              aux libertés, les traceurs ou cookies suivent deux régimes distincts.
            </p>
            <p>
              Les cookies strictement nécessaires au service ou ayant pour finalité exclusive de faciliter la
              communication par voie électronique sont dispensés de consentement préalable au titre de l’article 82 de
              la loi n° 78-17 du 6 janvier 1978.
            </p>
            <p>
              Les cookies n’étant pas strictement nécessaires au service ou n’ayant pas pour finalité exclusive de
              faciliter la communication par voie électronique doivent être consenti par l’utilisateur.
            </p>
            <p>
              Ce consentement de la personne concernée pour une ou plusieurs finalités spécifiques constitue une base
              légale au sens du RGPD et doit être entendu au sens de l'article 6-1 a) du RGPD.
            </p>
            <p>
              Index Egapro utilise notamment la solution de mesure d’audience «&nbsp;Matomo&nbsp;» paramétrée en mode
              «&nbsp;exempté&nbsp;» et ne nécessitant pas le recueil de votre consentement conformément aux
              recommandations de la CNIL. La durée de vie du cookie n’excède pas 13 mois.
            </p>
            <p>
              Vous êtes suivis de manière anonyme. Vous pouvez retirer votre consentement relatif aux cookies&nbsp;:{" "}
              <FooterConsentManagementItem />
            </p>
            <p>
              À tout moment, vous pouvez refuser l’utilisation des cookies et désactiver le dépôt sur votre ordinateur
              en utilisant la fonction dédiée de votre navigateur (fonction disponible notamment sur Microsoft Internet
              Explorer 11, Google Chrome, Mozilla Firefox, Apple Safari et Opera).
            </p>
            <p>
              Pour aller plus loin, vous pouvez consulter les fiches proposées par la Commission Nationale de
              l'Informatique et des Libertés (CNIL)&nbsp;:
            </p>
            <ul className={"fr-mb-3w"}>
              <li>
                <Link href="https://www.cnil.fr/fr/cookies-traceurs-que-dit-la-loi" target="_blank" rel="noreferrer">
                  Cookies & traceurs : que dit la loi ?
                </Link>
              </li>
              <li>
                <Link
                  href="https://www.cnil.fr/fr/cookies-les-outils-pour-les-maitriser"
                  target="_blank"
                  rel="noreferrer"
                >
                  Cookies : les outils pour les maîtriser
                </Link>
              </li>
            </ul>
          </GridCol>
        </Grid>
      </Container>
    </section>
  );
};

export default PrivacyPolicy;
