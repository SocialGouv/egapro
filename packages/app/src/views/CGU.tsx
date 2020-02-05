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
    <Page title="Conditions d’utilisation d'Index Egapro">
      <div css={styles.content}>
        <p>
          Les présentes conditions générales d’utilisation (dites « CGU »)
          fixent le cadre juridique de la Plateforme Index Egapro et définissent
          les conditions d’accès et d’utilisation des services par
          l’Utilisateur.
        </p>
        <h2 css={styles.title}>Champ d’application</h2>
        <p>
          La Plateforme est d’accès libre et gratuit à tout Utilisateur. La
          simple visite de la Plateforme suppose l’acceptation par tout
          Utilisateur des présentes conditions générales d’utilisation.
          <br />
          <br />
          L’inscription sur la Plateforme peut entraîner l’application de
          conditions spécifiques, listées dans les présentes Conditions
          d’Utilisation
        </p>
        <h2 css={styles.title}>Objet</h2>
        <p>
          Index Egapro entend faire progresser au sein des entreprises l’égalité
          salariale entre les femmes et les hommes. Il permet aux entreprises de
          mesurer, en toute transparence, les écarts de rémunération entre les
          sexes et de mettre en évidence leurs points de progression.
        </p>
        <h2 css={styles.title}>Fonctionnalités</h2>
        <p>
          Index Egapro a mis en place un simulateur en ligne grâce auquel tout
          utilisateur, sans se créer de compte, peut remplir des informations
          concernant son entreprise afin de calculer son Index et de connaître
          les écarts de salaire entre hommes et femmes au sein de sa structure.
          Dans le cadre du remplissage de ce formulaire, l’utilisateur a la
          possibilité de renseigner son adresse email afin d’enregistrer les
          données fournies et de remplir sa déclaration plus tard.
          <br />
          <br />
          Index Egapro propose également un formulaire de déclaration de cet
          Index afin qu’il soit transmis au Ministère du Travail. La plateforme
          propose également une FAQ et un moteur de recherche. Le code du
          logiciel est libre, et peut donc être vérifié et amélioré par tous :{" "}
          <a href="https://github.com/SocialGouv/egapro/">
            https://github.com/SocialGouv/egapro/
          </a>
        </p>
        <h2 css={styles.title}>Responsabilités</h2>
        <h3 css={styles.subtitle}>Index Egapro</h3>
        <p>
          Les sources des informations diffusées sur la Plateforme sont réputées
          fiables mais le site ne garantit pas qu’il soit exempt de défauts,
          d’erreurs ou d’omissions.
          <br />
          <br />
          Tout événement dû à un cas de force majeure ayant pour conséquence un
          dysfonctionnement de la Plateforme et sous réserve de toute
          interruption ou modification en cas de maintenance, n'engage pas la
          responsabilité de Index Egapro.
          <br />
          <br />
          L’éditeur s’engage à mettre en œuvre toutes mesures appropriées, afin
          de protéger les données traitées.
          <br />
          <br />
          L’éditeur s’engage à la sécurisation de la Plateforme, notamment en
          prenant toutes les mesures nécessaires permettant de garantir la
          sécurité et la confidentialité des informations fournies.
          <br />
          <br />
          L’éditeur fournit les moyens nécessaires et raisonnables pour assurer
          un accès continu, sans contrepartie financière, à la Plateforme. Il se
          réserve la liberté de faire évoluer, de modifier ou de suspendre, sans
          préavis, la plateforme pour des raisons de maintenance ou pour tout
          autre motif jugé nécessaire.
          <br />
          <br />
          Ce site peut mettre à disposition des liens pouvant orienter
          l’utilisateur vers des sites réalisés par des tiers extérieurs. Ces
          tiers sont les seuls responsables du contenu publié par leur soin.
          L’équipe n’a aucun contrôle sur le contenu de ces sites, ces contenus
          ne sauraient engager la responsabilité de l’administration.
        </p>
        <h3 css={styles.subtitle}>L'Utilisateur</h3>
        <p>
          Toute information transmise par l'Utilisateur est de sa seule
          responsabilité. Il est rappelé que toute personne procédant à une
          fausse déclaration pour elle-même ou pour autrui s’expose, notamment,
          aux sanctions prévues à l’article 441-1 du code pénal, prévoyant des
          peines pouvant aller jusqu’à trois ans d’emprisonnement et 45 000
          euros d’amende.
          <br />
          <br />
          L'Utilisateur s'engage à ne pas mettre en ligne de contenus ou
          informations contraires aux dispositions légales et réglementaires en
          vigueur.
          <br />
          <br />
          Le contenu de l'Utilisateur peut être à tout moment et pour n'importe
          quelle raison supprimé ou modifié par le site, sans préavis.
        </p>
        <h2 css={styles.title}>Protection des données à caractère personnel</h2>
        <h3 css={styles.subtitle}>Responsable de traitement</h3>
        <p>
          Les responsables de traitement sont Yves Struillou et Hélène Brisset.
          <br />
          <br />
          Le délégué à la protection des données est « DPO » : Danièla PARROT,{" "}
          <a href="mailto:dpd-minsociaux@sg.social.gouv.fr?subject=RGPD : protection des données sur Index Egapro">
            dpd-minsociaux@sg.social.gouv.fr
          </a>
        </p>
        <h3 css={styles.subtitle}>Données personnelles traitées</h3>
        <p>
          La présente Plateforme traite les données personnelles suivantes :
          <ul>
            <li>
              Pour les simples visiteurs : nature des opérations, date et heure
              de l'opération.
            </li>
            <li>
              Pour les utilisateurs du simulateur : nature des opérations, date
              et heure de l'opération.
            </li>
            <li>
              Pour les utilisateurs du formulaire de déclaration : adresse
              email, nom, prénom, numéro de téléphone.
            </li>
          </ul>
        </p>
        <h3 css={styles.subtitle}>Finalités</h3>
        <p>
          Ces données sont nécessaires et proportionnées pour la réalisation de
          la mission de la Plateforme. Elles permettent de calculer les écarts
          de rémunération femmes-hommes au sein des entreprises, et de réaliser
          les déclarations qui en sont issues.
        </p>
        <h3 css={styles.subtitle}>Bases juridiques</h3>
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
        <h3 css={styles.subtitle}>Duré de conservation</h3>
        <p>
          <ul>
            <li>
              Pour les cookies : 13 mois maximum, ou jusqu'au retrait du
              consentement de la personne concernée.
            </li>
            <li>Pour l'hébergeur : 12 mois (LCEN).</li>
            <li>
              Pour les données des utilisateurs du simulateur et du formulaire
              de déclaration : la durée de conservation des données par
              l'administration est de 3 ans.
            </li>
          </ul>
          Passés ces délais de conservation, les responsables de traitement
          s’engagent à supprimer définitivement les données des personnes
          concernées.
        </p>
        <h3 css={styles.subtitle}>Sécurité et confidentialité</h3>
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
              Accès aux données reservé aux membres de l'entité (hors
              restitution applicative publique des données) ;
            </li>
            <li>
              Accès aux données uniquement via un outil d'édition sécurisé (SSL
              + mot de passe) avec utilisation de comptes nominatifs.
            </li>
          </ul>
        </p>
        <h3 css={styles.subtitle}>Droits des personnes concernées</h3>
        <p>
          Vous disposez des droits suivants concernant vos données à caractère
          personnel :
          <ul>
            <li>
              Droit d’information, d’accès et de communication des données ;
            </li>
            <li>
              Droit de rectification et le cas échéant de suppression des
              données ;
            </li>
            <li>
              Droit d’opposition au traitement de données, le cas échéant.
            </li>
          </ul>
          Vous pouvez exercer ces droits en écrivant à{" "}
          <a href="mailto:dpd-minsociaux@sg.social.gouv.fr">
            dpd-minsociaux@sg.social.gouv.fr
          </a>
          <br />
          <br />
          En raison de l’obligation de sécurité et de confidentialité dans le
          traitement des données à caractère personnel qui incombe à EgaPro,
          votre demande sera uniquement traitée si vous rapportez la preuve de
          votre identité. Pour vous aider dans votre démarche, vous trouverez{" "}
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
        <h3 css={styles.subtitle}>Destinataires :</h3>
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
        <h3 css={styles.subtitle}>Sous-traitants :</h3>
        <p>
          Certaines des données sont envoyées à des sous-traitants pour réaliser
          certaines missions. Les responsables de traitement se sont assurés de
          la mise en œuvre par ses sous-traitants de garanties adéquates et du
          respect de conditions strictes de confidentialité, d’usage et de
          protection des données.
          <br />
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
        </p>
        <h3 css={styles.subtitle}>Cookies</h3>
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
              Le cookie ne permet pas de suivre la navigation de l’internaute
              sur d’autres sites
            </li>
          </ul>
          La mesure d’audience (nombre de visites, pages consultées) est
          réalisée par un outil libre intitulé Matomo spécifiquement paramétré,
          respectant les conditions d’exemption du consentement de l’internaute
          définies par la recommandation « Cookies » de la Commission nationale
          informatique et libertés (CNIL).
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
  subtitle: css({
    fontSize: 16,
    lineHeight: "22px",
    fontWeight: "bold",
    marginTop: 20,
    marginLeft: 0,
    marginRight: 0,
    marginBottom: 10
  }),
  table: css({
    thead: {
      backgroundColor: "#ccc"
    }
  })
};

export default CGU;
