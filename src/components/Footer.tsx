/** @jsx jsx */
import { css, jsx } from "@emotion/core"
import { Link } from "react-router-dom"
import { Box, Container } from "@chakra-ui/react"

import globalStyles from "../utils/globalStyles"
import Logo from "./Logo"

import { useLayoutType } from "./GridContext"

import packageConfig from "../../package.json"

function Footer() {
  const layoutType = useLayoutType()
  const isDesktop = layoutType === "desktop"
  const isMobile = layoutType === "mobile"
  const version = process.env.REACT_APP_VERSION || packageConfig.version

  return (
    <Box
      as="footer"
      role="contentinfo"
      py={6}
      sx={{
        borderTop: "1px solid #E3E4ED",
        "@media print": {
          display: "none",
        },
      }}
    >
      <Container
        maxW="container.xl"
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Box pr={6}>
          <a
            href="https://travail-emploi.gouv.fr/"
            target="_blank"
            rel="noopener noreferrer"
            css={[
              styles.containerLogo,
              isDesktop && styles.containerLogoDesktop,
              isMobile && styles.containerLogoMobile,
            ]}
          >
            <Logo />
          </a>
        </Box>

        <ul css={[styles.footerLinks, isMobile && css({ margin: "1em" })]}>
          <li>
            <a
              href="https://travail-emploi.gouv.fr/droit-du-travail/egalite-professionnelle-discrimination-et-harcelement/indexegapro"
              target="_blank"
              rel="noopener noreferrer"
              css={[styles.link, isMobile && styles.linkMobile]}
            >
              retrouvez le simulateur au format Excel
            </a>
          </li>
          <li>
            <Link to="/mentions-legales" css={[styles.link, isMobile && styles.linkMobile]}>
              mentions légales
            </Link>
          </li>
          <li>
            <Link to="/accessibilite" css={[styles.link, isMobile && styles.linkMobile]}>
              accessibilité&nbsp;: non conforme
            </Link>
          </li>
          <li>
            <Link to="/cgu" css={[styles.link, isMobile && styles.linkMobile]}>
              conditions générales d'utilisation
            </Link>
          </li>
          <li>
            <Link to="/politique-confidentialite" css={[styles.link, isMobile && styles.linkMobile]}>
              politique de confidentialité
            </Link>
          </li>
        </ul>

        <div css={[styles.footerInfo, isMobile && styles.footerInfoMobile]}>
          <p style={styles.info}>
            Index Egapro a été développé par les équipes de la fabrique numérique des ministères sociaux
          </p>
          <p style={styles.info}>
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
          </p>
        </div>
      </Container>
    </Box>
  )
}

const styles = {
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
  containerLogoMobile: css({
    margin: 0,
  }),

  footerLinks: {
    display: "flex",
    listStyle: "none",
    flexDirection: "column" as const,
  },
  link: {
    display: "inline-block",
    fontSize: 14,
    color: globalStyles.colors.default,
    textDecoration: "underline",
  },
  linkMobile: {
    fontSize: 14,
  },

  footerInfo: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "0%",
    display: "flex",
    flexDirection: "column" as const,
    textAlign: "right" as const,
    marginRight: globalStyles.grid.gutterWidth,
  },
  footerInfoMobile: { margin: "1em", textAlign: "left" as const },
  info: {
    fontStyle: "italic",
    fontSize: 12,
    lineHeight: 1.25,
    marginBottom: 4,
  },
  infoLink: {
    color: globalStyles.colors.default,
    textDecoration: "underline",
    marginLeft: 8,
  },
}

export default Footer
