/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { RouteComponentProps } from "react-router-dom";

import { ActionType } from "../globals";

import Page from "../components/Page";

interface Props extends RouteComponentProps {
  dispatch: (action: ActionType) => void;
}

function Legal({ history, location, dispatch }: Props) {
  return (
    <Page title="Mentions légales de Egapro">
      <div css={styles.content}>
        <h2 css={styles.title}>Editeur de la Plateforme</h2>
        La Plateforme EgaPro est éditée par l’Incubateur des Ministères sociaux
        situé : <br />
        Tour Mirabeau 39-43
        <br />
        Quai André Citroën
        <br />
        75015 PARIS
        <br />
        Tél : 01 40 56 60 00
        <br />
      </div>

      <div css={styles.content}>
        <h2 css={styles.title}>Directeur de la publication</h2>
        Yves Struillou.
      </div>

      <div css={styles.content}>
        <h2 css={styles.title}>Hébergement de la Plateforme</h2>
        Ce site est hébergé en propre parle Ministère des Affaires sociales et
        de la Santé : Ministère des Affaires sociales et de la Santé 14 avenue
        Duquesne 75530 PARIS
      </div>

      <div css={styles.content}>
        <h2 css={styles.title}>Accessibilité</h2>
        La conformité aux normes d’accessibilité numérique est un objectif
        ultérieur mais nous tâchons de rendre ce site accessible à toutes et à
        tous.
      </div>

      <div css={styles.content}>
        <h2 css={styles.title}>Signaler un dysfonctionnement</h2>
        Si vous rencontrez un défaut d’accessibilité vous empêchant d’accéder à
        un contenu ou une fonctionnalité du site, merci de nous en faire part.
        Si vous n’obtenez pas de réponse rapide de notre part, vous êtes en
        droit de faire parvenir vos doléances ou une demande de saisine au
        Défenseur des droits.
      </div>

      <div css={styles.content}>
        <h2 css={styles.title}>En savoir plus</h2>
        Pour en savoir plus sur la politique d’accessibilité numérique de l’État
        : http://references.modernisation.gouv.fr/accessibilite-numerique
      </div>

      <div css={styles.content}>
        <h2 css={styles.title}>Sécurité</h2>
        Le site est protégé par un certificat électronique, matérialisé pour la
        grande majorité des navigateurs par un cadenas. Cette protection
        participe à la confidentialité des échanges. En aucun cas les services
        associés à la plateforme ne seront à l’origine d’envoi de courriels pour
        demander la saisie d’informations personnelles.
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
  })
};

export default Legal;
