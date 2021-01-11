/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { Link } from "react-router-dom";

import globalStyles from "../utils/globalStyles";
import Logo from "./Logo";

import { useColumnsWidth, useLayoutType } from "./GridContext";

function Footer() {
  const width = useColumnsWidth(2);
  const layoutType = useLayoutType();
  const version =
    process.env.REACT_APP_VERSION || require("../../package.json").version;

  return (
    <footer
      css={[
        styles.footer,
        layoutType === "desktop" &&
          css({ marginLeft: -(width + globalStyles.grid.gutterWidth) }),
      ]}
    >
      <div
        css={[
          styles.footerLeft,
          layoutType === "desktop" && css({ width }),
          styles.footerLeftPrint,
        ]}
      >
        <a
          href="https://travail-emploi.gouv.fr/"
          target="_blank"
          rel="noopener noreferrer"
          css={[
            styles.containerLogo,
            layoutType === "desktop" && styles.containerLogoDesktop,
          ]}
        >
          <Logo />
        </a>
      </div>

      <div css={styles.footerLinks}>
        <a
          href="https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle-discrimination-et-harcelement/index-egalite-professionnelle-femmes-hommes"
          target="_blank"
          rel="noopener noreferrer"
          css={styles.link}
        >
          retrouvez le simulateur au format Excel
        </a>
        <Link to="/mentions-legales" css={styles.link}>
          mentions légales
        </Link>
        <Link to="/cgu" css={styles.link}>
          conditions générales d'utilisation
        </Link>
        <Link to="/politique-confidentialite" css={styles.link}>
          politique de confidentialité
        </Link>
      </div>

      <div css={styles.footerInfo}>
        <em style={styles.info}>
          L’outil Index Egapro a été développé par les équipes de la fabrique numérique
          des ministères sociaux
        </em>
        <span style={styles.info}>
          Pour nous aider à l'améliorer
          <a
            href="https://voxusagers.numerique.gouv.fr/Demarches/2240?&view-mode=formulaire-avis&nd_mode=en-ligne-enti%C3%A8rement&nd_source=button&key=73366ddb13d498f4c77d01c2983bab48"
            target="_blank"
            rel="noopener noreferrer"
            css={styles.infoLink}
          >
            donnez-nous votre avis
          </a>
          <a
            href={`https://github.com/SocialGouv/egapro/tree/${version}`}
            target="_blank"
            rel="noopener noreferrer"
            css={styles.infoLink}
          >
            contribuez sur Github
          </a>
        </span>
      </div>
    </footer>
  );
}

const styles = {
  footer: css({
    backgroundColor: "#FFF",
    height: 120,
    marginTop: 54,
    flexShrink: 0,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    borderTop: "1px solid #EFECEF",
    "@media print": {
      display: "none",
    },
  }),
  footerLeft: css({
    display: "flex",
    flexDirection: "row",
    marginLeft: globalStyles.grid.gutterWidth,
    marginRight: globalStyles.grid.gutterWidth,
    "@media print": {
      marginLeft: 0,
    },
  }),
  footerLeftPrint: css({
    "@media print": {
      width: "auto",
    },
  }),
  containerLogo: css({
    marginLeft: "auto",
    marginRight: 0,
    textDecoration: "none",
    color: "currentColor",
  }),
  containerLogoDesktop: css({
    marginRight: 25,
  }),

  footerLinks: { display: "flex", flexDirection: "column" as "column" },
  link: {
    fontSize: 10,
    lineHeight: "11px",
    color: globalStyles.colors.default,
    textDecoration: "underline",
    margin: "2px 0",
  },

  footerInfo: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "0%",
    display: "flex",
    flexDirection: "column" as "column",
    textAlign: "right" as "right",
    marginRight: globalStyles.grid.gutterWidth,
  },
  info: {
    fontSize: 12,
    lineHeight: "15px",
    marginBottom: 4,
  },
  infoLink: {
    color: globalStyles.colors.default,
    textDecoration: "underline",
    marginLeft: 8,
  },
};

export default Footer;
