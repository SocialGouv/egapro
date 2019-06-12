/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { RouteComponentProps } from "react-router-dom";

import Page from "../components/Page";
import ButtonLink from "../components/ButtonLink";

function Home(props: RouteComponentProps) {
  return (
    <Page
      title="Bienvenue sur l'outil Egapro"
      tagline="L’index de l’égalité professionnelle a été conçu 
               pour faire progresser au sein des entreprises l’égalité salariale 
               entre les femmes et les hommes.
               <br/>Il permet aux entreprises de mesurer, en toute transparence, 
               les écarts de rémunération entre les sexes et de mettre en évidence 
               leurs points de progression. Lorsque des disparités salariales sont constatées, 
               des mesures de correction doivent être prises.
               <br/>Avec l’outil de simulation en ligne, calculez votre Index de façon simple et rapide, 
               tout en profitant d’une aide sur les détails du calcul de chaque indicateur et sur les questions 
               les plus fréquemment posées. "
    >
      <div css={styles.action}>
        <ButtonLink to="/simulateur" label="commencer la simulation" />
      </div>
    </Page>
  );
}

const styles = {
  action: css({
    display: "flex",
    flexDirection: "row"
  })
};

export default Home;
