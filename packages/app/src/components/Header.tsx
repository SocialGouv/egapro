/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Link } from "react-router-dom";

import globalStyles from "../utils/globalStyles";

import { useColumnsWidth, useLayoutType } from "./GridContext";

import Logo from "./Logo";

function Header() {
  const width = useColumnsWidth(2);
  const layoutType = useLayoutType();
  return (
    <header css={styles.header}>
      <div
        css={[
          styles.headerLeft,
          layoutType === "desktop" && css({ width }),
          styles.headerLeftPrint
        ]}
      >
        <a
          href="https://travail-emploi.gouv.fr/"
          target="_blank"
          rel="noopener noreferrer"
          css={styles.containerLogo}
        >
          <Logo />
        </a>
      </div>
      <div css={styles.headerInner}>
        <Link to="/" css={styles.title}>
          Egapro
        </Link>
        <p css={styles.subtitle}>
          L’outil de calcul de votre Index de l’égalité professionnelle Femmes
          Hommes
        </p>
      </div>
    </header>
  );
}

const styles = {
  header: css({
    backgroundColor: "#FFF",
    height: 80,
    flexShrink: 0,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottom: "1px solid #EFECEF"
  }),
  headerLeft: css({
    display: "flex",
    flexDirection: "row",
    marginLeft: globalStyles.grid.gutterWidth,
    marginRight: globalStyles.grid.gutterWidth,
    "@media print": {
      marginLeft: 0
    }
  }),
  headerLeftPrint: css({
    "@media print": {
      width: "auto"
    }
  }),
  containerLogo: css({
    marginLeft: "auto",
    marginRight: 25,
    textDecoration: "none",
    color: "currentColor"
  }),
  headerInner: css({
    display: "flex",
    flexDirection: "row",
    flexGrow: 1,
    alignItems: "baseline"
  }),
  title: css({
    fontFamily: "'Gabriela', serif",
    marginRight: 24,
    fontSize: 24,
    color: globalStyles.colors.default,
    textDecoration: "none"
  }),
  subtitle: css({
    fontFamily: "'Gabriela', serif",
    fontSize: 12
  })
};

export default Header;
