/** @jsx jsx */
import { css, jsx } from "@emotion/core"

import globalStyles from "../utils/globalStyles"

import Logo from "../components/Logo"
import ActionLink from "../components/ActionLink"
import Footer from "../components/Footer"
import { Fragment } from "react"
import { useTitle } from "../utils/hooks"

interface Props {
  openMenu: () => void
}

const title = "Page d'affichage mobile"

function MobileHome({ openMenu }: Props) {
  useTitle(title)

  return (
    <Fragment>
      <div css={styles.page}>
        <Logo layout="mobile" />

        <h1 css={styles.title}>
          Bienvenue
          <br />
          sur Index Egapro
        </h1>

        <p css={styles.subtitle}>
          L’outil de calcul et de déclaration de votre index égalité professionnelle Femmes-Hommes
        </p>

        <p css={styles.para}>
          L’Index de l'égalité professionnelle a été conçu pour faire progresser au sein des entreprises l’égalité
          salariale entre les femmes et les hommes.
        </p>
        <p css={styles.para}>
          Il permet aux entreprises de mesurer, en toute transparence, les écarts de rémunération entre les sexes et de
          mettre en évidence leurs points de progression. Lorsque des disparités salariales sont constatées, des mesures
          de correction doivent être prises.
        </p>

        <div css={styles.info}>
          <p css={[styles.para, styles.noMargin]}>
            Le calcul et la déclaration de l'index nécessitent un affichage plus grand. Mais vous pouvez accéder à toute
            l'aide en ligne et à la FAQ.
          </p>
        </div>

        <div css={styles.illuBloc}>
          <div css={styles.image} />

          <div css={styles.help}>
            <ActionLink style={styles.helpButton} onClick={openMenu}>
              ?
            </ActionLink>
            <span css={styles.helpText}>aide</span>
          </div>

          <div css={styles.arrow}>
            <svg width="49" height="108" viewBox="0 0 49 108" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M48.7071 100.707C49.0976 100.317 49.0976 99.6834 48.7071 99.2929L42.3431 92.9289C41.9526 92.5384 41.3194 92.5384 40.9289 92.9289C40.5384 93.3195 40.5384 93.9526 40.9289 94.3431L46.5857 100L40.9289 105.657C40.5384 106.047 40.5384 106.681 40.9289 107.071C41.3194 107.462 41.9526 107.462 42.3431 107.071L48.7071 100.707ZM0.499949 0.5C0.499949 17.9416 -0.133314 42.976 5.40911 63.6341C8.1839 73.9765 12.5293 83.3202 19.3587 90.0854C26.2152 96.8776 35.5053 101 48 101V99C35.9946 99 27.2222 95.0599 20.7662 88.6646C14.2831 82.2423 10.066 73.2735 7.34079 63.1159C1.88321 42.774 2.49995 18.0584 2.49995 0.5H0.499949Z"
                fill="#191A49"
              />
            </svg>
          </div>
        </div>
      </div>
      <Footer />
    </Fragment>
  )
}

const styles = {
  page: css({
    display: "flex",
    flexDirection: "column",
    paddingTop: 16,
    paddingRight: 28,
    paddingLeft: 28,
    paddingBottom: 28,
    "@media print": {
      display: "block",
      marginRight: 0,
    },
  }),
  title: css({
    marginTop: 16,
    fontSize: 32,
    lineHeight: "34px",
    fontWeight: "normal",
    marginLeft: 0,
    marginRight: 0,
    marginBottom: 8,
  }),
  subtitle: css({
    fontFamily: "'Gabriela', serif",
    fontSize: 12,
    lineHeight: "15px",
  }),
  para: css({
    marginTop: 16,
    fontSize: 14,
    lineHeight: "17px",
  }),
  noMargin: css({ margin: 0 }),

  info: css({
    width: 264,
    alignSelf: "center",
    marginTop: 45,
    padding: "7px 10px",
    backgroundColor: "#EFF0FA",
  }),

  illuBloc: css({
    height: 150,
    position: "relative",
  }),
  help: css({
    position: "absolute",
    bottom: 0,
    right: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  }),
  helpButton: css({
    width: 44,
    height: 44,

    borderRadius: 22,
    backgroundColor: globalStyles.colors.primary,

    color: "white",
    WebkitTextFillColor: "#FFF",
    fontFamily: "'Gabriela', serif",
    fontSize: 32,
    textDecoration: "none",

    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }),
  helpText: css({
    fontSize: 12,
    lineHeight: "15px",
  }),
  image: css({
    height: 112,
    width: 176,
    position: "absolute",
    bottom: 0,
    left: 0,
    backgroundImage: `url(${process.env.PUBLIC_URL}/illustration-home-simulator.svg)`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
  }),
  arrow: css({
    position: "absolute",
    top: 10,
    right: 56,
  }),
}

export default MobileHome
