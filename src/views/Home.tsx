/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { RouteComponentProps } from "react-router-dom";

import { CategorieSocioPro } from "../globals.d";

import LinkButton from "../components/LinkButton";

function Home(props: RouteComponentProps) {
  return (
    <div>
      <div css={styles.bloc}>
        <p css={styles.blocTitle}>Index de l'égalité</p>

        <div css={styles.message}>
          <p>
            5 indicateurs pour résorber les inégalités entre les femmes et les
            hommes en entreprise.
          </p>
        </div>

        <div css={styles.message}>
          <p>Entreprises de plus de 250 salariés</p>
        </div>

        <LinkButton
          to={`/effectifs/${CategorieSocioPro.Ouvriers}`}
          label="Commencer"
        />
      </div>
    </div>
  );
}

const styles = {
  bloc: css({
    display: "flex",
    flexDirection: "column",
    maxWidth: 800,
    padding: "12px 24px",
    margin: "24px auto",
    backgroundColor: "white",
    borderRadius: 6,
    boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.12)"
  }),
  blocTitle: css({
    fontSize: 24,
    paddingTop: 6,
    paddingBottom: 24,
    color: "#353535",
    textAlign: "center"
  }),
  message: css({
    fontSize: 26,
    fontWeight: 200,
    textAlign: "center",
    marginBottom: 32,
    marginTop: 12
  })
};

export default Home;
