/** @jsx jsx */
import { css, jsx } from "@emotion/core"
import { Link } from "react-router-dom"
import { Box, Container } from "@chakra-ui/react"

import globalStyles from "../utils/globalStyles"
import { MenuProfile } from "./ds/MenuProfile"

import Logo from "./Logo"

function Header() {
  return (
    <Box py={6} as="header" role="banner" css={styles.header}>
      <Container
        maxW="container.xl"
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box pr={6}>
          <a
            href="https://travail-emploi.gouv.fr/"
            target="_blank"
            rel="noopener noreferrer"
            css={[styles.containerLogo]}
          >
            <Logo />
          </a>
        </Box>
        <div css={styles.headerInner}>
          <Link to="/" css={styles.title}>
            Index Egapro
          </Link>
          <p css={styles.subtitle}>
            L’outil de calcul et de déclaration de votre index égalité professionnelle Femmes-Hommes
          </p>
        </div>
        <div>
          <MenuProfile />
        </div>
      </Container>
    </Box>
  )
}

const styles = {
  header: css({
    backgroundColor: "#FFF",
    flexShrink: 0,
    borderBottom: "1px solid #E3E4ED",
  }),
  headerLeft: css({
    display: "flex",
    flexDirection: "row",
    marginLeft: globalStyles.grid.gutterWidth,
    marginRight: globalStyles.grid.gutterWidth,
    "@media print": {
      marginLeft: 0,
    },
  }),
  headerLeftPrint: css({
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
  headerInner: css({
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    alignItems: "baseline",
  }),
  title: css({
    fontFamily: "'Gabriela', serif",
    marginRight: 24,
    fontSize: 24,
    color: globalStyles.colors.default,
    textDecoration: "none",
  }),
  subtitle: css({
    fontFamily: "'Gabriela', serif",
    fontSize: 12,
  }),
}

export default Header
