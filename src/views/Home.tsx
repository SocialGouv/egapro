/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { RouteComponentProps } from "react-router-dom";

import { CategorieSocioPro } from "../globals.d";

import ButtonLink from "../components/ButtonLink";

function Home(props: RouteComponentProps) {
  return (
    <div>
      <div css={styles.bloc}>
        <p css={styles.blocTitle}>Bienvenue sur Egapro</p>

        <p css={styles.message}>
          5 indicateurs pour résorber les inégalités entre les femmes et les
          hommes en entreprise.
        </p>

        <div css={styles.action}>
          <ButtonLink
            to={`/effectifs/${CategorieSocioPro.Ouvriers}`}
            label="commencer la simulation"
          />
        </div>
      </div>
    </div>
  );
}

const styles = {
  bloc: css({
    display: "flex",
    flexDirection: "column",
    maxWidth: 1024,
    padding: "12px 0",
    margin: "24px auto"
  }),
  blocTitle: css({
    fontSize: 32
  }),
  message: css({
    fontSize: 14
  }),
  action: css({
    display: "flex",
    flexDirection: "row",
    marginTop: 18
  })
};

export default Home;
