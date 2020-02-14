/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Link } from "react-router-dom";

import globalStyles from "../utils/globalStyles";

import { useColumnsWidth, useLayoutType } from "./GridContext";

import Logo from "./Logo";
import InfoBloc from "./InfoBloc";

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
          css={[
            styles.containerLogo,
            layoutType === "desktop" && styles.containerLogoDesktop
          ]}
        >
          <Logo />
        </a>
      </div>
      <div css={styles.headerInner}>
        <Link to="/" css={styles.title}>
          Index Egapro
        </Link>
        <p css={styles.subtitle}>
          L’outil de calcul et de déclaration de votre index égalité
          professionnelle Femmes- Hommes
        </p>
      </div>
      {new Date() < new Date("2020-02-19 14:00:00") && (
        <div css={styles.bannerWrapper}>
          <InfoBloc
            title="Interruption de service programmée"
            text="Le service sera indisponible le mercredi 19 février à partir de 12h30 pour une durée d'environ 1h30"
            additionalCss={styles.banner}
            closeButton={true}
          />
        </div>
      )}
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
    marginRight: 0,
    textDecoration: "none",
    color: "currentColor"
  }),
  containerLogoDesktop: css({
    marginRight: 25
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
  }),
  bannerWrapper: css({
    position: "fixed",
    left: 0,
    top: 30,
    width: "100%",
    zIndex: 1000
  }),
  banner: css({
    backgroundColor: "#fff",
    margin: "10px auto",
    width: "70%"
  })
};

export default Header;
