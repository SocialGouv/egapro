/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { useRef } from "react";
import { RouteComponentProps } from "react-router-dom";

import globalStyles from "../utils/globalStyles";

import Page from "../components/Page";
import ActionLink from "../components/ActionLink";
import ActionBar from "../components/ActionBar";
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
    <Page title="Bienvenue sur Index Egapro">
      <div css={styles.codeCopyBloc}>
        <div css={styles.codeCopyFakeInput}>
          <span ref={textEl} css={styles.codeCopyText} onClick={onCopy}>
            {link}
          </span>
        </div>
        <ActionLink onClick={onCopy}>copier le lien</ActionLink>
      </div>

      <p css={styles.tagline}>
        Afin de pouvoir réaccéder à tout moment à votre calcul : pensez à copier
        le code ci-dessus et le conserver précieusement.
      </p>

      <div css={styles.imageContainer}>
        <div css={styles.image} />
      </div>

      <ActionBar>
        <ButtonSimulatorLink to="/effectifs" label="suivant" />
      </ActionBar>
    </Page>
  );
}

const styles = {
  codeCopyBloc: css({
    display: "flex",
    alignItems: "flex-end"
  }),
  codeCopyFakeInput: css({
    flex: 1,
    marginRight: 20,
    height: 38,
    display: "flex",
    alignItems: "center",
    paddingLeft: globalStyles.grid.gutterWidth,
    paddingRight: globalStyles.grid.gutterWidth,
    background: "white",
    border: `solid ${globalStyles.colors.default} 1px`
  }),
  codeCopyText: css({}),

  tagline: css({
    marginTop: 36,
    fontSize: 14,
    lineHeight: "17px"
  }),

  imageContainer: css({
    marginTop: 160,
    height: 151,
    width: 384,
    position: "relative"
  }),
  image: css({
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    left: -(globalStyles.grid.gutterWidth * 2),
    backgroundImage: `url(${
      process.env.PUBLIC_URL
    }/illustration-home-simulator.svg)`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "contain"
  })
};

export default HomeSimulateur;
