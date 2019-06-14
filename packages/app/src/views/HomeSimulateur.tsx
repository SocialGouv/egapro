/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useRef } from "react";
import { RouteComponentProps } from "react-router-dom";

import globalStyles from "../utils/globalStyles";

import Page from "../components/Page";
import ActionLink from "../components/ActionLink";
import { ButtonSimulatorLink } from "../components/SimulatorLink";

function HomeSimulateur(props: RouteComponentProps) {
  const textEl = useRef<HTMLSpanElement>(null);

  const link = window.location.href;
  const onCopy = () => {
    if (textEl.current && window.getSelection) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(textEl.current);
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }

    navigator.clipboard.writeText(link);
  };
  return (
    <Page
      title="Bienvenue sur Egapro"
      tagline="Voici votre lien-code d’accès : conservez le précieusement, il vous permettra d’accèder à tout moment à votre simulation"
    >
      <div css={styles.codeCopyBloc}>
        <span ref={textEl} css={styles.codeCopyText} onClick={onCopy}>
          {link}
        </span>
        <ActionLink onClick={onCopy}>copier le lien</ActionLink>
      </div>
      <div css={styles.codeCopyVideo} />
      <div css={styles.action}>
        <ButtonSimulatorLink to="/effectifs" label="suivant" />
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
