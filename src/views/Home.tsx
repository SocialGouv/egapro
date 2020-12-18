/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useState } from "react";
import { RouteComponentProps } from "react-router-dom";

import { ActionType } from "../globals";
import { postIndicatorsDatas } from "../utils/api";

import Page from "../components/Page";
import ButtonAction from "../components/ButtonAction";
import ButtonLink from "../components/ButtonLink";
import ErrorMessage from "../components/ErrorMessage";
import globalStyles from "../utils/globalStyles";

interface Props extends RouteComponentProps {
  dispatch: (action: ActionType) => void;
}

function Home({ history, location, dispatch }: Props) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(undefined);

  const onClick = () => {
    setLoading(true);
    dispatch({ type: "resetState" });

    postIndicatorsDatas({})
      .then(({ jsonBody: { id } }) => {
        setLoading(false);
        history.push(`/simulateur/${id}`, {
          ...(location.state && location.state),
          openModalEmail: true,
        });
      })
      .catch((error) => {
        setLoading(false);
        const errorMessage =
          (error.jsonBody && error.jsonBody.message) ||
          "Erreur lors de la récupération du code";
        setErrorMessage(errorMessage);
      });
  };

  if (!loading && errorMessage) {
    return ErrorMessage(errorMessage);
  }

  return (
    <Page
      title="Bienvenue sur Index Egapro"
      tagline={[
        "L’Index d'égalité professionnelle a été conçu pour faire progresser au sein des entreprises l’égalité salariale entre les femmes et les hommes.",
        "Il permet aux entreprises de mesurer, en toute transparence, les écarts de rémunération entre les sexes et de mettre en évidence leurs points de progression. Lorsque des disparités salariales sont constatées, des mesures de correction doivent être prises.",
      ]}
    >
      <div css={styles.content}>
        <h2 css={styles.title}>
          Comment calculer et déclarer l’index égalité femmes-hommes ?
        </h2>

        <div css={styles.twoColumns}>
          <div css={styles.bloc}>
            <div css={styles.blocImage}>
              <div css={[styles.image, styles.illustrationSimulator]} />
            </div>

            <div css={styles.blocContent}>
              <span css={styles.blocContentStep}>Choix 1</span>
              <span css={styles.blocContentTitle}>
                Calcul et déclaration de l'index
              </span>
              <p css={styles.blocContentBody}>
                Vous pouvez calculer votre index égalité professionnelle F/H sur
                Index Egapro et le déclarer, si vous le souhaitez, suite au
                calcul.
              </p>

              <div>
                <ButtonAction
                  onClick={onClick}
                  label="commencer le calcul"
                  disabled={loading}
                  loading={loading}
                />
              </div>
            </div>
          </div>

          <div css={styles.bloc}>
            <div css={styles.blocImage}>
              <div css={[styles.image, styles.illustrationPublish]} />
            </div>

            <div css={styles.blocContent}>
              <span css={styles.blocContentStep}>Choix 2</span>
              <span css={styles.blocContentTitle}>
                Déclaration directe de l'index
              </span>
              <p css={styles.blocContentBody}>
                Vous pouvez déclarer votre index égalité professionnelle F/H
                calculé par ailleurs directement via le formulaire suivant :
              </p>

              <div>
                <ButtonLink
                  label="déclarer directement"
                  to="/declaration/"
                />
              </div>
            </div>
          </div>
        </div>
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
    marginLeft: 0,
    marginRight: 0,
  }),

  twoColumns: css({
    display: "flex",
    flexDirection: "row",
  }),
  bloc: css({
    marginBottom: 50,
    padding: 10,
    width: "50%",
  }),
  blocImage: css({
    width: 300,
    height: 205,
    flexShrink: 0,
    position: "relative",
  }),

  image: css({
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    left: -globalStyles.grid.gutterWidth,
    backgroundRepeat: "no-repeat",
    backgroundSize: "contain",
  }),
  illustrationData: css({
    backgroundImage: `url(${process.env.PUBLIC_URL}/illustration-data.svg)`,
  }),
  illustrationSimulator: css({
    backgroundImage: `url(${process.env.PUBLIC_URL}/illustration-simulator.svg)`,
  }),
  illustrationPublish: css({
    backgroundImage: `url(${process.env.PUBLIC_URL}/illustration-publish.svg)`,
  }),

  blocContent: css({
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    display: "flex",
    flexDirection: "column",
    paddingTop: 10,
    paddingBottom: 10,
  }),
  blocContentStep: css({
    display: "inline-block",
    fontSize: 12,
    lineHeight: "15px",
    fontWeight: "bold",
    textTransform: "uppercase",
  }),
  blocContentTitle: css({
    display: "inline-block",
    fontSize: 18,
    lineHeight: "22px",
    textTransform: "uppercase",
    marginBottom: 14,
  }),
  blocContentBody: css({
    fontSize: 14,
    lineHeight: "17px",
    marginBottom: "auto",
    paddingBottom: 10,
  }),

  blocContentInfo: css({
    fontSize: 14,
    lineHeight: "17px",
    fontStyle: "italic",
  }),
  button: css({
    display: "inline-flex",
    textDecoration: "none",
  }),
};

export default Home;
