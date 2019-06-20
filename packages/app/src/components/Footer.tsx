/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import globalStyles from "../utils/globalStyles";
import Logo from "./Logo";

import { useColumnsWidth, useLayoutType } from "./GridContext";

function Footer() {
  const width = useColumnsWidth(2);
  const layoutType = useLayoutType();
  return (
    <footer
      css={[
        styles.footer,
        layoutType === "desktop" &&
          css({ marginLeft: -(width + globalStyles.grid.gutterWidth) })
      ]}
    >
      <div
        css={[
          styles.footerLeft,
          layoutType === "desktop" && css({ width }),
          styles.footerLeftPrint
        ]}
      >
        <a
          href="https://travail-emploi.gouv.fr/"
          target="_blank"
          rel="noopener noreferrer"
          css={[
            styles.containerLogo,
            layoutType === "mobile" && styles.containerLogoMobile
          ]}
        >
          <Logo />
        </a>
      </div>

      <div css={styles.footerLinks}>
        <a
          href="https://travail-emploi.gouv.fr/actualites/l-actualite-du-ministere/article/index-de-l-egalite-femmes-hommes-comment-le-calculer"
          target="_blank"
          rel="noopener noreferrer"
          css={styles.link}
        >
          retrouvez le simulateur au format Excel
        </a>
        <a
          href="https://solen1.enquetes.social.gouv.fr/cgi-5/HE/SF?P=1162z18z2z-1z-1zFD0365AA36"
          target="_blank"
          rel="noopener noreferrer"
          css={styles.link}
        >
          accédez au formulaire de déclaration
        </a>
      </div>

      <div css={styles.footerInfo}>
        <em style={styles.info}>
          L’outil Index Egapro a été développé par les équipes de l’incubateur
          des ministères sociaux
        </em>
        <span style={styles.info}>
          Pour nous aider à l'améliorer
          <a
            href="https://travail-emploi.gouv.fr/"
            target="_blank"
            rel="noopener noreferrer"
            css={styles.infoLink}
          >
            donnez-nous votre avis
          </a>
          <a
            href="https://github.com/SocialGouv/egapro"
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
    height: 80,
    marginTop: 54,
    flexShrink: 0,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    borderTop: "1px solid #EFECEF",
    "@media print": {
      display: "none"
    }
  }),
  footerLeft: css({
    display: "flex",
    flexDirection: "row",
    marginLeft: globalStyles.grid.gutterWidth,
    marginRight: globalStyles.grid.gutterWidth,
    "@media print": {
      marginLeft: 0
    }
  }),
  footerLeftPrint: css({
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
  containerLogoMobile: css({
    marginRight: 0
  }),

  footerLinks: { display: "flex", flexDirection: "column" as "column" },
  link: {
    fontSize: 10,
    lineHeight: "11px",
    color: globalStyles.colors.default,
    textDecoration: "underline",
    margin: "2px 0"
  },

  footerInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as "column",
    textAlign: "right" as "right",
    marginRight: globalStyles.grid.gutterWidth
  },
  info: {
    fontSize: 12,
    lineHeight: "15px",
    marginBottom: 4
  },
  infoLink: {
    color: globalStyles.colors.default,
    textDecoration: "underline",
    marginLeft: 8
  }
};

export default Footer;
