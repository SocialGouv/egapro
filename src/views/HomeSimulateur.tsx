/** @jsx jsx */
import { css, jsx } from "@emotion/core"
import { useRef } from "react"

import globalStyles from "../utils/globalStyles"

import Page from "../components/Page"
import ActionLink from "../components/ActionLink"
import ActionBar from "../components/ActionBar"
import { ButtonSimulatorLink } from "../components/SimulatorLink"
import { useTitle } from "../utils/hooks"

const title = "Début d'un calcul d'index"

function HomeSimulateur(): JSX.Element {
  useTitle(title)

  const textEl = useRef<HTMLSpanElement>(null)

  const link = window.location.href
  const onCopy = () => {
    if (textEl.current && window.getSelection) {
      const selection = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(textEl.current)
      if (selection) {
        selection.removeAllRanges()
        selection.addRange(range)
      }

      if (navigator.clipboard) {
        navigator.clipboard.writeText(link)
      } else {
        document.execCommand("copy")
      }
    }
  }

  return (
    <Page title="Bienvenue sur Index Egapro">
      <div>
        <div css={styles.codeCopyBloc}>
          <div css={styles.codeCopyFakeInput}>
            <span
              ref={textEl}
              role="button"
              tabIndex={0}
              css={styles.codeCopyText}
              onClick={onCopy}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === "Space") {
                  onCopy()
                }
              }}
            >
              {link}
            </span>
          </div>
          <div css={styles.codeCopyAction}>
            <ActionLink onClick={onCopy}>copier le lien</ActionLink>
          </div>
        </div>

        <p css={styles.tagline}>
          Afin de pouvoir réaccéder à tout moment à votre calcul : pensez à copier le code ci-dessus et le conserver
          précieusement.
        </p>

        <div css={styles.imageContainer}>
          <div css={styles.image} />
        </div>

        <ActionBar>
          <ButtonSimulatorLink to="/informations" label="suivant" />
        </ActionBar>
      </div>
    </Page>
  )
}

const styles = {
  codeCopyBloc: css({
    display: "flex",
    alignItems: "flex-end",
  }),
  codeCopyFakeInput: css({
    flexShrink: 1,
    flexGrow: 1,
    marginRight: 20,

    paddingTop: 9,
    paddingBottom: 9,
    paddingLeft: globalStyles.grid.gutterWidth,
    paddingRight: globalStyles.grid.gutterWidth,
    background: "white",
    border: `solid ${globalStyles.colors.default} 1px`,

    overflow: "hidden",
    textOverflow: "ellipsis",
  }),
  codeCopyText: css({
    fontSize: 14,
    lineHeight: "17px",
  }),
  codeCopyAction: css({
    flexShrink: 0,
  }),

  tagline: css({
    marginTop: 36,
    fontSize: 14,
    lineHeight: "17px",
  }),

  imageContainer: css({
    marginTop: 160,
    height: 151,
    width: 384,
    position: "relative",
  }),
  image: css({
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    left: -(globalStyles.grid.gutterWidth * 2),
    backgroundImage: `url(${process.env.PUBLIC_URL}/illustration-home-simulator.svg)`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "contain",
  }),
}

export default HomeSimulateur
