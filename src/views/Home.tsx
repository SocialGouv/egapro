/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { RouteComponentProps } from "react-router-dom";

import Page from "../components/Page";
import ButtonLink from "../components/ButtonLink";

function Home(props: RouteComponentProps) {
  return (
    <Page
      title="Bienvenue sur Egapro"
      tagline="5 indicateurs pour résorber les inégalités entre les femmes et les hommes en entreprise."
    >
      <div css={styles.action}>
        <ButtonLink to="/effectifs" label="commencer la simulation" />
      </div>
    </Page>
  );
}

const styles = {
  action: css({
    display: "flex",
    flexDirection: "row",
    marginTop: 18
  })
};

export default Home;
