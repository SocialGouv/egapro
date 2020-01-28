/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { RouteComponentProps } from "react-router-dom";

import { ActionType } from "../globals";

import Page from "../components/Page";

interface Props extends RouteComponentProps {
  dispatch: (action: ActionType) => void;
}

function MentionsLegales({ history, location, dispatch }: Props) {
  return (
    <Page title="Mentions légales de EgaPro">
      <div css={styles.content}>
        <h2 css={styles.title}>Editeur de la Plateforme</h2>
        <p>
          Index Egapro est édité par la Fabrique Numérique des Ministères
          sociaux situés à :
          <br />
          Tour Mirabeau
          <br />
          39-43 Quai André Citroën
          <br />
          75015 PARIS
          <br />
          Tél : 01 40 56 60 00
        </p>
        <h2 css={styles.title}>Directeur de la publication</h2>
        <p>Yves Struillou.</p>
        <h2 css={styles.title}>Hébergement de la Plateforme</h2>
        <p>
          Ce site est hébergé au :
          <br />
          Ministère des Affaires sociales et de la Santé
          <br />
          14 avenue Duquesne
          <br />
          75530 PARIS
        </p>
        <h2 css={styles.title}>Accessibilité</h2>
        <p>
          La conformité aux normes d’accessibilité numérique est un objectif
          ultérieur mais nous tâchons de rendre ce site accessible à toutes et à
          tous.
        </p>
        <h3 css={styles.subtitle}>Signaler un dysfonctionnement</h3>
        <p>
          Si vous rencontrez un défaut d’accessibilité vous empêchant d’accéder
          à un contenu ou une fonctionnalité du site, merci de nous en faire
          part.
          <br />
          Si vous n’obtenez pas de réponse rapide de notre part, vous êtes en
          droit de faire parvenir vos doléances ou une demande de saisine au
          Défenseur des droits.
        </p>
        <h3 css={styles.subtitle}>En savoir plus</h3>
        <p>
          Pour en savoir plus sur la politique d’accessibilité numérique de
          l’État :<br />
          <a href="http://references.modernisation.gouv.fr/accessibilite-numerique">
            http://references.modernisation.gouv.fr/accessibilite-numerique
          </a>
        </p>
        <h2 css={styles.title}>Sécurité</h2>
        <p>
          Le site est protégé par un certificat électronique, matérialisé pour
          la grande majorité des navigateurs par un cadenas. Cette protection
          participe à la confidentialité des échanges. En aucun cas les services
          associés à la plateforme ne seront à l’origine d’envoi de courriels
          pour demander la saisie d’informations personnelles.
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
    marginTop: 60,
    marginLeft: 0,
    marginRight: 0,
    marginBottom: 30
  }),
  subtitle: css({
    fontSize: 16,
    lineHeight: "22px",
    fontWeight: "bold",
    marginTop: 60,
    marginLeft: 0,
    marginRight: 0,
    marginBottom: 30
  })
};

export default MentionsLegales;
