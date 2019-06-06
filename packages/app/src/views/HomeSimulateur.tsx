/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { RouteComponentProps } from "react-router-dom";

import globalStyles from "../utils/globalStyles";

import Page from "../components/Page";
import ActionLink from "../components/ActionLink";
import ButtonLink from "../components/ButtonLink";

function HomeSimulateur(props: RouteComponentProps) {
  return (
    <Page
      title="Bienvenue sur Egapro"
      tagline="Voici votre lien-code d’accès : conservez le précieusement, il vous permettra d’accèder à tout moment à votre simulation"
    >
      <div css={styles.codeCopyBloc}>
        <span css={styles.codeCopyText}>
          https://egapro.example.com/simulateur/MddPBM
        </span>
        <ActionLink onClick={() => {}}>copier le code</ActionLink>
      </div>
      <div css={styles.codeCopyVideo} />
      <div css={styles.action}>
        <ButtonLink to="/effectifs" label="suivant" />
      </div>
    </Page>
  );
}

const styles = {
  codeCopyBloc: css({
    display: "flex",
    alignItems: "flex-end",
    marginBottom: 42
  }),
  codeCopyText: css({
    flex: 1,
    marginRight: 20,
    borderBottom: `solid ${globalStyles.colors.default} 1px`
  }),
  codeCopyVideo: css({
    height: 372,
    border: `solid ${globalStyles.colors.default} 1px`
  }),
  action: css({
    display: "flex",
    flexDirection: "row",
    marginTop: 32
  })
};

export default HomeSimulateur;
