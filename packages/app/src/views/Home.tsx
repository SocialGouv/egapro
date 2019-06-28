/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useState } from "react";
import { RouteComponentProps } from "react-router-dom";

import { ActionType } from "../globals.d";
import { postIndicatorsDatas } from "../utils/api";

import Page from "../components/Page";
import ButtonAction from "../components/ButtonAction";
import Button from "../components/Button";
import globalStyles from "../utils/globalStyles";

interface Props extends RouteComponentProps {
  dispatch: (action: ActionType) => void;
}

function Home({ history, location, dispatch }: Props) {
  const [loading, setLoading] = useState(false);

  const onClick = () => {
    setLoading(true);
    dispatch({ type: "resetState" });

    postIndicatorsDatas({}).then(({ jsonBody: { id } }) => {
      setLoading(false);
      history.push(`/simulateur/${id}`, {
        ...(location.state && location.state),
        openModalEmail: true
      });
    });
  };

  return (
    <Page
      title="Bienvenue sur Index Egapro"
      tagline={[
        "L’Index de l'égalité professionnelle a été conçu pour faire progresser au sein des entreprises l’égalité salariale entre les femmes et les hommes.",
        "Il permet aux entreprises de mesurer, en toute transparence, les écarts de rémunération entre les sexes et de mettre en évidence leurs points de progression. Lorsque des disparités salariales sont constatées, des mesures de correction doivent être prises.",
        "Avec l'outil de simulation en ligne, calculez votre Index de façon simple et rapide, tout en profitant de l’aide sur les détails du calcul de chaque indicateur et sur les questions les plus fréquemment posées.",
        "Pour le moment, l’outil est configuré pour les entreprises de plus de 250 salariés : il le sera bientôt pour les entreprises de 50 à 250 salariés !"
      ]}
    >
      <div css={styles.action}>
        <ButtonAction
          onClick={onClick}
          label="commencer le calcul"
          disabled={loading}
          loading={loading}
        />
      </div>
      <div css={styles.content}>
        <h2 css={styles.title}>
          Comment calculer l’index égalité femmes-hommes ?
        </h2>

        <div css={styles.bloc}>
          <div css={styles.blocImage}>
            <div css={[styles.image, styles.illustrationData]} />
          </div>

          <div css={styles.blocContent}>
            <span css={styles.blocContentStep}>Étape 1</span>
            <span css={styles.blocContentTitle}>
              Consolidation des données nécessaires au calcul
            </span>
            <p css={styles.blocContentBody}>
              Afin de procéder à la simulation, les entreprises doivent extraire
              des données relatives à leurs salariés. Grâce à l’outil Index
              Egapro, une aide est disponible pour chacun des indicateurs . Si
              l’entreprise décide de ne pas utiliser le simulateur, elle peut
              tout de même consulter l'aide et la FAQ mise à disposition.
            </p>

            <span css={styles.blocContentInfo}>Consultez l'aide ici ! →</span>
          </div>
        </div>

        <div css={styles.bloc}>
          <div css={styles.blocImage}>
            <div css={[styles.image, styles.illustrationSimulator]} />
          </div>

          <div css={styles.blocContent}>
            <span css={styles.blocContentStep}>Étape 2</span>
            <span css={styles.blocContentTitle}>Calcul de l'index</span>
            <p css={styles.blocContentBody}>
              L’entreprise saisit les données et l’outil Index Egapro calcule
              automatiquement les indicateurs et la note finale.
            </p>

            <ButtonAction
              onClick={onClick}
              label="commencer le calcul"
              disabled={loading}
              loading={loading}
            />
          </div>
        </div>

        <div css={styles.bloc}>
          <div css={styles.blocImage}>
            <div css={[styles.image, styles.illustrationPublish]} />
          </div>

          <div css={styles.blocContent}>
            <span css={styles.blocContentStep}>Étape 3</span>
            <span css={styles.blocContentTitle}>
              Déclaration et publication de l’index
            </span>
            <p css={styles.blocContentBody}>
              Enfin, l’entreprise doit déclarer ses résultats, selon le délai
              imparti, dans l’outil SOLEN. Afin de faciliter la déclaration,
              l'outil Index Egapro affiche à la fin du calcul une page avec
              toutes les informations à déclarer. L’entreprise peut également
              télécharger son récapitulatif pour le publier sur son site
              internet ou l’envoyer au CSE.
            </p>

            <a
              href="https://solen1.enquetes.social.gouv.fr/cgi-5/HE/SF?P=1162z18z2z-1z-1zFD0365AA36"
              target="_blank"
              rel="noopener noreferrer"
              css={styles.button}
            >
              <Button label="accéder à la déclaration" />
            </a>
          </div>
        </div>
      </div>
    </Page>
  );
}

const styles = {
  action: css({
    display: "flex",
    flexDirection: "row"
  }),
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

  bloc: css({
    display: "flex",
    flexDirection: "row",
    marginBottom: 50
  }),
  blocImage: css({
    width: 300,
    height: 205,
    flexShrink: 0,
    position: "relative"
  }),

  image: css({
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    left: -globalStyles.grid.gutterWidth,
    backgroundRepeat: "no-repeat",
    backgroundSize: "contain"
  }),
  illustrationData: css({
    backgroundImage: `url(${process.env.PUBLIC_URL}/illustration-data.svg)`
  }),
  illustrationSimulator: css({
    backgroundImage: `url(${process.env.PUBLIC_URL}/illustration-simulator.svg)`
  }),
  illustrationPublish: css({
    backgroundImage: `url(${process.env.PUBLIC_URL}/illustration-publish.svg)`
  }),

  blocContent: css({
    flexGrow: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    marginLeft: 24,
    paddingTop: 10,
    paddingBottom: 10
  }),
  blocContentStep: css({
    fontSize: 12,
    lineHeight: "15px",
    fontWeight: "bold",
    textTransform: "uppercase"
  }),
  blocContentTitle: css({
    fontSize: 18,
    lineHeight: "22px",
    textTransform: "uppercase",
    marginBottom: 14
  }),
  blocContentBody: css({
    fontSize: 14,
    lineHeight: "17px",
    marginBottom: "auto",
    paddingBottom: 10
  }),

  blocContentInfo: css({
    fontSize: 14,
    lineHeight: "17px",
    fontStyle: "italic",
    alignSelf: "flex-end"
  }),
  button: css({
    display: "inline-flex",
    textDecoration: "none"
  })
};

export default Home;
