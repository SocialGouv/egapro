/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { RouteComponentProps } from "react-router-dom";

import { ActionType } from "../globals";

import Page from "../components/Page";

interface Props extends RouteComponentProps {
  dispatch: (action: ActionType) => void;
}

function CGU({ history, location, dispatch }: Props) {
  return (
    <Page title="Protection des données à caractère personnel">
      <div css={styles.content}>
        <h2 css={styles.title}>Responsable de traitement</h2>
        <p>
          Les responsables de traitement sont Pierre Ramain et Hélène Brisset.
          <br />
          <br />
          Le délégué à la protection des données est « DPD » : Danièla PARROT,{" "}
          <a href="mailto:dpd-minsociaux@sg.social.gouv.fr?subject=RGPD : protection des données sur Index Egapro">
            dpd-minsociaux@sg.social.gouv.fr
          </a>
        </p>
        <h2 css={styles.title}>Données personnelles traitées</h2>
        <p>
          La présente Plateforme traite les données personnelles suivantes :
        </p>
        <ul>
          <li>
            Pour les simples visiteurs : nature des opérations, date et heure de
            l'opération.
          </li>
          <li>
            Pour les utilisateurs du simulateur : nature des opérations, date et
            heure de l'opération.
          </li>
          <li>
            Pour les utilisateurs du formulaire de déclaration : adresse email,
            nom, prénom, numéro de téléphone.
          </li>
        </ul>
        <h2 css={styles.title}>Finalités</h2>
        <p>
          Ces données sont nécessaires et proportionnées pour la réalisation de
          la mission de la Plateforme. Elles permettent de calculer l'index au
          sein des entreprises, et de réaliser les déclarations qui en sont
          issues.
        </p>
        <h2 css={styles.title}>Bases juridiques</h2>
        <p>
          Conformément aux dispositions de l’article 6 du Règlement relatif à la
          protection des données (appelé RGPD), le traitement est nécessaire à
          l’exécution d’une mission d’intérêt public ou relève de l’exercice de
          l’autorité publique dont est investi le Responsable de traitement.
          <br />
          <br />
          Pour certains cookies, la base juridique du traitement est le
          consentement des personnes concernées.
        </p>
        <h2 css={styles.title}>Duré de conservation</h2>
        <ul>
          <li>
            Pour les cookies : 13 mois maximum, ou jusqu'au retrait du
            consentement de la personne concernée.
          </li>
          <li>Pour l'hébergeur : 12 mois (LCEN).</li>
          <li>
            Pour les données des utilisateurs du simulateur et du formulaire de
            déclaration : la durée de conservation des données par
            l'administration est de 3 ans.
          </li>
        </ul>
        <p>
          Passés ces délais de conservation, les responsables de traitement
          s’engagent à supprimer définitivement les données des personnes
          concernées.
        </p>
        <h2 css={styles.title}>Sécurité et confidentialité</h2>
        <p>
          Les données personnelles sont traitées dans des conditions sécurisées,
          selon les moyens actuels de la technique, dans le respect des
          dispositions relatives à la protection de la vie privée et notamment
          au référentiel général de sécurité, prévu à l’article 9 de
          l’ordonnance 2005-1516 du 8 décembre 2005 relative aux échanges
          électroniques entre les usagers et les autorités administratives et
          entre les autorités administratives.
          <br />
          <br />
          Les moyens de sécurisation suivants ont notamment été mis en oeuvre :
        </p>
        <ul>
          <li>Pare feu système ;</li>
          <li>Pare feu applicatif (WAF) ;</li>
          <li>Chiffrement des flux reseaux via certificat SSL ;</li>
          <li>Disque dur chiffré ;</li>
          <li>Services isolés dans des containers ;</li>
          <li>Gestion des journaux ;</li>
          <li>Monitoring Azure ;</li>
          <li>Administration et monitoring centralisés des accès ;</li>
          <li>
            Accès aux ressources via clés SSH (pas de mot de passe post
            installation) ;
          </li>
          <li>
            Sauvegarde des bases de données via solution de stockage Azure ;
          </li>
          <li>
            Accès aux données reservé aux membres de l'entité (hors restitution
            applicative publique des données) ;
          </li>
          <li>
            Accès aux données uniquement via un outil d'édition sécurisé (SSL +
            mot de passe) avec utilisation de comptes nominatifs.
          </li>
        </ul>
        <h2 css={styles.title}>Droits des personnes concernées</h2>
        <p>
          Vous disposez des droits suivants concernant vos données à caractère
          personnel :
        </p>
        <ul>
          <li>
            Droit d’information, d’accès et de communication des données ;
          </li>
          <li>
            Droit de rectification et le cas échéant de suppression des
            données ;
          </li>
          <li>Droit d’opposition au traitement de données, le cas échéant.</li>
        </ul>
        <p>
          Vous pouvez exercer ces droits en écrivant à{" "}
          <a href="mailto:dpd-minsociaux@sg.social.gouv.fr">
            dpd-minsociaux@sg.social.gouv.fr
          </a>
          <br />
          <br />
          En raison de l’obligation de sécurité et de confidentialité dans le
          traitement des données à caractère personnel qui incombe à Index
          Egapro, votre demande sera uniquement traitée si vous rapportez la
          preuve de votre identité. Pour vous aider dans votre démarche, vous
          trouverez{" "}
          <a href="https://www.cnil.fr/fr/modele/courrier/exercer-son-droit-dacces">
            ici
          </a>
           un modèle de courrier élaboré par la Cnil.
          <br />
          <br />
          Vous avez la possibilité de vous opposer à un traitement de vos
          données personnelles. Pour vous aider dans votre démarche, vous
          trouverez{" "}
          <a href="https://www.cnil.fr/fr/modele/courrier/rectifier-des-donnees-inexactes-obsoletes-ou-perimees">
            ici
          </a>
           un modèle de courrier élaboré par la Cnil.
          <br />
          <br />
          <strong>Délais de réponse</strong>
          <br />
          Les responsables s’engagent à répondre à votre demande d’accès, de
          rectification ou d’opposition ou toute autre demande complémentaire
          d’informations dans un délai raisonnable qui ne saurait dépasser 1
          mois à compter de la réception de votre demande.
        </p>
        <h2 css={styles.title}>Destinataires :</h2>
        <p>
          Les données collectées et les demandes, ou dossiers réalisés depuis la
          Plateforme sont traitées par les seules personnes juridiquement
          habilitées à connaître des informations traitées.
          <br />
          <br />
          Les responsables de traitement veillent à ne fournir des accès qu’aux
          seules personnes juridiquement habilitées à connaître des informations
          traitées.
        </p>
        <h2 css={styles.title}>Sous-traitants :</h2>
        <p>
          Certaines des données sont envoyées à des sous-traitants pour réaliser
          certaines missions. Les responsables de traitement se sont assurés de
          la mise en œuvre par ses sous-traitants de garanties adéquates et du
          respect de conditions strictes de confidentialité, d’usage et de
          protection des données.
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
          </tbody>
        </table>
        <h2 css={styles.title}>Cookies</h2>
        <p>
          Index Egapro, en tant qu’éditeurs de la présente Plateforme, pourra
          faire usage de cookies. Certains cookies sont dispensés du recueil
          préalable de votre consentement dans la mesure où ils sont strictement
          nécessaires à la fourniture du service. Les traceurs ont vocation à
          être conservés sur le poste informatique de l'Internaute pour une
          durée allant jusqu'à 13 mois.
          <br />
          <br />
          Mesure d’audience :
          <br />
          <br />
          Certains cookies permettent d’établir des mesures statistiques de
          fréquentation et d’utilisation du site pouvant être utilisées à des
          fins de suivi et d’amélioration du service :
        </p>
        <ul>
          <li>
            Les données collectées ne sont pas recoupées avec d’autres
            traitements.
          </li>
          <li>
            Le cookie déposé sert uniquement à la production de statistiques
            anonymes.
          </li>
          <li>
            Le cookie ne permet pas de suivre la navigation de l’internaute sur
            d’autres sites
          </li>
        </ul>
        <p>
          La mesure d’audience (nombre de visites, pages consultées) est
          réalisée par un outil libre intitulé Matomo spécifiquement paramétré,
          respectant les conditions d’exemption du consentement de l’internaute
          définies par la recommandation « Cookies » de la Commission nationale
          informatique et libertés (CNIL).
          <br />
          <br />
          Vous pouvez tout de même désactiver cet outil :
          <iframe
            css={styles.iframe}
            title="désactivez Matomo"
            src="https://matomo.fabrique.social.gouv.fr/index.php?module=CoreAdminHome&action=optOut&language=fr&backgroundColor=&fontColor=&fontSize=&fontFamily="
          ></iframe>
        </p>
        <h2 css={styles.title}>Mise à jour des conditions d’utilisation</h2>
        <p>
          Les termes des présentes conditions d’utilisation peuvent être amendés
          à tout moment, sans préavis, en fonction des modifications apportées à
          la plateforme, de l’évolution de la législation ou pour tout autre
          motif jugé nécessaire.
        </p>
      </div>
    </Page>
  );
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
    marginBottom: 20
  }),
  table: css({
    thead: {
      backgroundColor: "#ccc"
    }
  }),
  iframe: css({
    width: 600
  })
};

export default CGU;
