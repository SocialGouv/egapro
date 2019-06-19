/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useState } from "react";
import { RouteComponentProps } from "react-router-dom";

import { postIndicatorsDatas } from "../utils/api";

import Page from "../components/Page";
import ButtonAction from "../components/ButtonAction";
import Button from "../components/Button";

function Home({ history }: RouteComponentProps) {
  const [loading, setLoading] = useState(false);
  const onClick = () => {
    setLoading(true);
    postIndicatorsDatas({}).then(({ jsonBody: { id } }) => {
      setLoading(false);
      history.push(`/simulateur/${id}`);
    });
  };
  return (
    <Page
      title="Bienvenue sur Index Egapro"
      tagline={[
        "L’index de l’égalité professionnelle a été conçu pour faire progresser au sein des entreprises l’égalité salariale entre les femmes et les hommes.",
        "Il permet aux entreprises de mesurer, en toute transparence, les écarts de rémunération entre les sexes et de mettre en évidence leurs points de progression. Lorsque des disparités salariales sont constatées, des mesures de correction doivent être prises.",
        "Avec l’outil de simulation en ligne, calculez votre Index de façon simple et rapide, tout en profitant d’une aide sur les détails du calcul de chaque indicateur et sur les questions les plus fréquemment posées."
      ]}
    >
      <div css={styles.action}>
        <ButtonAction
          onClick={onClick}
          label="commencer la simulation"
          disabled={loading}
          loading={loading}
        />
      </div>
      <div css={styles.content}>
        <h2 css={styles.title}>
          Comment calculer l’index Egalité Femmes-Hommes ?
        </h2>

        <div css={styles.bloc}>
          <div css={styles.blocImage} />

          <div css={styles.blocContent}>
            <span css={styles.blocContentStep}>Étape 1</span>
            <span css={styles.blocContentTitle}>
              Consolidation des données nécessaires au calcul
            </span>
            <p css={styles.blocContentBody}>
              Afin de procéder à la simulation, les entreprises doivent extraire
              des données relatives à leurs salariés. Grace à l’outil Egapro,
              une aide est disponible pour chacun des indicateurs . Si
              l’entreprise décide de ne pas utiliser le simulateur, elle peut
              tout de même consulter les pas à pas et les FAQ grâce à l’aide
              présente sur le côté droit de cet écran.
            </p>

            <span css={styles.blocContentInfo}>
              l’aide et les pas à pas se trouvent ici ! →
            </span>
          </div>
        </div>

        <div css={styles.bloc}>
          <div css={styles.blocImage} />

          <div css={styles.blocContent}>
            <span css={styles.blocContentStep}>Étape 2</span>
            <span css={styles.blocContentTitle}>Simulation de l’Index</span>
            <p css={styles.blocContentBody}>
              L’entreprise peut ensuite saisir ses données, l’outil Egapro
              calcule automatiquement ses indicateurs ainsi que son Index.
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
          <div css={styles.blocImage} />

          <div css={styles.blocContent}>
            <span css={styles.blocContentStep}>Étape 3</span>
            <span css={styles.blocContentTitle}>
              Déclaration et publication de l’index
            </span>
            <p css={styles.blocContentBody}>
              Enfin, l’entreprise doit renseigner ses résultats, avant le 1er
              Septembre, dans l’outil SOLEN. Grace à l’outil Egapro,
              l’entreprise à acces sur une page à toutes les informations
              nécessaire à la déclaration. L’entreprise peut également
              télécharger son récapitulatif et le publier sur son site internet
              ou l’envoyer à son CSE.
            </p>

            <a
              href="https://solen1.enquetes.social.gouv.fr/cgi-5/HE/SF?P=1162z18z2z-1z-1zFD0365AA36"
              target="_blank"
              rel="noopener noreferrer"
              css={styles.button}
            >
              <Button label="accèder à la déclaration" />
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
    border: "solid black 1px"
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
    marginBottom: "auto"
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
