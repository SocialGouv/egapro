/** @jsx jsx */
import { css, jsx } from "@emotion/react"

import Page from "../components/Page"
import { useTitle } from "../utils/hooks"

function CGU() {
  useTitle("Politique de confidentialité")

  return (
    <Page title="Protection des données à caractère personnel">
      <div css={styles.content}>
        <h2 css={styles.title}>Responsable de traitement</h2>
        <p>Le responsable de traitements est la Direction Générale du Travail.</p>
        <h2 css={styles.title}>Données personnelles traitées</h2>
        <p>La présente Plateforme traite les données personnelles suivantes :</p>
        <ul>
          <li>
            Pour les simples visiteurs : identifiants de connexion, nature des opérations, date et heure de l'opération.
          </li>
          <li>Pour les utilisateurs du simulateur : adresse email, nom, prénom, numéro de téléphone.</li>
          <li>Pour les utilisateurs du formulaire de déclaration : adresse email, nom, prénom, numéro de téléphone.</li>
        </ul>
        <h2 css={styles.title}>Finalités</h2>
        <p>
          Ces données sont nécessaires et proportionnées pour la réalisation de la mission de la Plateforme. Elles
          permettent de calculer les écarts de rémunération femmes-hommes au sein des entreprises, et de réaliser les
          déclarations qui en sont issues.
        </p>
        <h2 css={styles.title}>Bases juridiques des traitements de données</h2>
        <p>
          Conformément aux dispositions de l'article 6-e du Règlement relatif à la protection des données (appelé RGPD),
          le traitement est nécessaire à l'exécution d'une mission d'intérêt public ou relève de l'exercice de
          l'autorité publique dont est investi le Responsable de traitement.
          <br />
          <br />
          Conformément aux dispositions de l'article 6-c du Règlement relatif à la protection des données (appelé RGPD),
          le traitement de données relatif aux données de connexion est fondé sur l'obligation légale reposant sur le
          responsable de traitement au titre de la loi LCEN n° 2004-575 du 21 juin 2004 pour la confiance dans
          l'économie numérique et par l'article 1 du décret n°2021-1363 portant injonction, au regard de la menace grave
          et actuelle contre la sécurité nationale, de conservation pour une durée d'un an de certaines catégories de
          données de connexion.
        </p>
        <h2 css={styles.title}>Durée de conservation</h2>
        <ul>
          <li>
            Pour les données de connexion ou d'hébergeur : 12 mois (LCEN et articles 1 et 5 du décret n°2021-1362 du 20
            octobre 2021 relatif à la conservation des données).
          </li>
          <li>
            Pour les données des utilisateurs du simulateur et du formulaire de déclaration : temps nécessaire au
            traitement de la demande, sans excéder 3 mois.
          </li>
        </ul>
        <p>
          Passés ces délais de conservation, les responsables de traitement s'engagent à supprimer définitivement les
          données des personnes concernées.
        </p>
        <h2 css={styles.title}>Sécurité et confidentialité</h2>
        <p>
          Les données personnelles sont traitées dans des conditions sécurisées, selon les moyens actuels de la
          technique, dans le respect des dispositions relatives à la protection de la vie privée et notamment au
          référentiel général de sécurité, prévu à l'article 9 de l'ordonnance 2005-1516 du 8 décembre 2005 relative aux
          échanges électroniques entre les usagers et les autorités administratives et entre les autorités
          administratives.
          <br />
          <br />
          Les moyens de sécurisation suivants ont notamment été mis en oeuvre :
        </p>
        <ul>
          <li>Pare feu système ;</li>
          <li>Pare feu applicatif (WAF) ;</li>
          <li>Chiffrement des flux réseaux via certificat SSL ;</li>
          <li>Disque dur chiffré ;</li>
          <li>Services isolés dans des containers ;</li>
          <li>Gestion des journaux ;</li>
          <li>Monitoring Azure ;</li>
          <li>Administration et monitoring centralisés des accès ;</li>
          <li>Accès aux ressources via clés SSH (pas de mot de passe post installation) ;</li>
          <li>Sauvegarde des bases de données via solution de stockage Azure ;</li>
          <li>
            Accès aux données réservé aux membres de l'entité (hors restitution applicative publique des données) ;
          </li>
          <li>
            Accès aux données uniquement via un outil d'édition sécurisé (SSL + mot de passe) avec utilisation de
            comptes nominatifs.
          </li>
        </ul>
        <h2 css={styles.title}>Droits des personnes concernées</h2>
        <p>Vous disposez des droits suivants concernant vos données à caractère personnel en tant qu'utilisateurs :</p>
        <ul>
          <li>Droit d'information, d'accès et de communication des données ;</li>
          <li>Droit de rectification et le cas échéant de suppression des données ;</li>
          <li>Droit d'opposition au traitement de données, le cas échéant.</li>
        </ul>
        <p>Vous disposez des droits suivants concernant vos données de connexion :</p>
        <ul>
          <li>Droit d'information et droit d'accès ;</li>
          <li>Droit de rectification.</li>
        </ul>
        <p>
          Vous pouvez exercer ces droits en écrivant à <a href="mailto:index@travail.gouv.fr">index@travail.gouv.fr</a>
          <br />
          <br />
          En raison de l'obligation de sécurité et de confidentialité dans le traitement des données à caractère
          personnel qui incombe à Index Egapro, votre demande sera uniquement traitée si vous rapportez la preuve de
          votre identité. Pour vous aider dans votre démarche, vous trouverez{" "}
          <a href="https://www.cnil.fr/fr/modele/courrier/exercer-son-droit-dacces">ici</a>
          un modèle de courrier élaboré par la Cnil.
          <br />
          <br />
          Vous avez la possibilité de vous opposer à un traitement de vos données personnelles. Pour vous aider dans
          votre démarche, vous trouverez{" "}
          <a href="https://www.cnil.fr/fr/modele/courrier/rectifier-des-donnees-inexactes-obsoletes-ou-perimees">ici</a>
          un modèle de courrier élaboré par la Cnil.
          <br />
          <br />
          <strong>Délais de réponse</strong>
          <br />
          Le responsable de traitement s'engage à répondre à votre demande d'accès, de rectification ou d'opposition ou
          toute autre demande complémentaire d'informations dans un délai raisonnable qui ne saurait dépasser 1 mois à
          compter de la réception de votre demande.
        </p>
        <h2 css={styles.title}>Destinataires :</h2>
        <p>
          Les données collectées et les demandes, ou dossiers réalisés depuis la Plateforme sont traitées par les seules
          personnes juridiquement habilitées à connaître des informations traitées.
          <br />
          <br />
          Le responsable de traitement veillent à ne fournir des accès qu'aux seules personnes juridiquement habilitées
          à connaître des informations traitées.
        </p>
        <h2 css={styles.title}>Sous-traitants :</h2>
        <p>
          Certaines des données sont envoyées à des sous-traitants pour réaliser certaines missions. Les responsables de
          traitement se sont assurés de la mise en œuvre par ses sous-traitants de garanties adéquates et du respect de
          conditions strictes de confidentialité, d'usage et de protection des données.
        </p>
        <br />
        <table css={styles.table}>
          <thead>
            <tr>
              <th>Partenaire</th>
              <th>Pays destinataire</th>
              <th>Traitement réalisé</th>
              <th>Garanties</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Microsoft Azure</td>
              <td>France</td>
              <td>Hébergement</td>
              <td>
                <a href="https://privacy.microsoft.com/fr-fr/privacystatement">
                  https://privacy.microsoft.com/fr-fr/privacystatement
                </a>
              </td>
            </tr>
            <tr>
              <td>Google</td>
              <td>États-Unis</td>
              <td>Mesure d'audience</td>
              <td>
                <a href="https://policies.google.com/privacy?hl=fr ">https://policies.google.com/privacy?hl=fr</a>
              </td>
            </tr>
          </tbody>
        </table>
        <h2 css={styles.title}>Cookies</h2>
        <p>
          Index Egapro pourra faire usage de cookies. Les traceurs ont vocation à être conservés sur le poste
          informatique de l'Internaute pour une durée allant jusqu'à 13 mois.
        </p>

        <p>Mesure d'audience :</p>

        <p>
          Certains cookies permettent d'établir des mesures statistiques de fréquentation et d'utilisation du site
          pouvant être utilisées à des fins de suivi et d'amélioration du service.
        </p>
        <br />
        <br />

        <table css={styles.table}>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Type</th>
              <th>Usage</th>
              <th>Émetteur</th>
              <th>Qui a accès ?</th>
              <th>Consentement</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>GoogleAnalytics</td>
              <td>Mesure d'audience</td>
              <td>Outil Google de mesure d'audience ;</td>
              <td>Google</td>
              <td>Direction Générale du Travail ; Google</td>
              <td>Oui</td>
            </tr>
            <tr>
              <td>GoogleTagManager</td>
              <td>Mesure d'audience</td>
              <td> Outil Google de gestion de balises ;</td>
              <td>Google</td>
              <td>Direction Générale du Travail ; Google</td>
              <td>Oui</td>
            </tr>
            <tr>
              <td>Ad.doubleclick.net</td>
              <td>Publicité</td>
              <td>Service de publicité et de diffusion d'annonce</td>
              <td>Google</td>
              <td>Direction Générale du Travail ; Google</td>
              <td>Oui</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Page>
  )
}

const styles = {
  content: css({}),
  title: css({
    fontSize: 18,
    lineHeight: "22px",
    fontWeight: "bold",
    marginTop: 30,
    marginLeft: 0,
    marginRight: 0,
    marginBottom: 20,
  }),
  table: css({
    thead: {
      backgroundColor: "#ccc",
    },
  }),
  iframe: css({
    width: 600,
  }),
}

export default CGU
