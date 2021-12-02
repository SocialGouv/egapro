/** @jsx jsx */
import { css, jsx } from "@emotion/core"
import { ReactNode } from "react"

import globalStyles from "../../../utils/globalStyles"

import ResultBubble, { Props as ResultBubbleProps } from "../../../components/ResultBubble"

import { useColumnsWidth, useLayoutType } from "../../../components/GridContext"

interface Props {
  title: string
  children: ReactNode
  resultBubble: ResultBubbleProps
}

export function RecapBloc({ title, children, resultBubble }: Props) {
  const layoutType = useLayoutType()
  const width = useColumnsWidth(layoutType === "desktop" ? 4 : 5)

  return (
    <div css={styles.container}>
      <div css={[styles.blocInfo, css({ width }), styles.blocInfoPrint]}>
        <div css={styles.title}>{title}</div>

        {children && (
          <div css={styles.bloc}>
            <div css={styles.background} />

            <div css={styles.bloc}>{children}</div>
          </div>
        )}

        <div css={[styles.borderBottomBloc, !children && styles.borderNoChildren]} />
        <div css={[styles.borderLeftBloc, !children && styles.borderNoChildren]} />
      </div>

      <div css={styles.blocResult}>
        <div css={[styles.borderBottomResult, !children && styles.borderNoChildren]} />
        <div css={[styles.borderRightResult, !children && styles.borderNoChildren]} />
        <ResultBubble {...resultBubble} />
      </div>
    </div>
  )
}

const styles = {
  container: css({
    position: "relative",
    display: "flex",
    flexDirection: "row",
    pageBreakInside: "avoid", // doesn't seems to work…
    breakInside: "avoid",
  }),
  background: css({
    backgroundColor: "#FFF",
    position: "absolute",
    top: -20,
    bottom: -20,
    left: -38,
    right: -38,
    borderRadius: "100%",
    border: "1px solid #E3E4ED",
    "@media print": {
      display: "none",
    },
  }),

  blocInfo: css({
    position: "relative",
    flexShrink: 0,
    paddingLeft: globalStyles.grid.gutterWidth,
    "@media print": {
      flexShrink: 1,
      flexGrow: 1,
    },
  }),
  blocInfoPrint: css({
    "@media print": {
      width: "auto",
    },
  }),
  title: css({
    marginBottom: 20,
    fontSize: 18,
    lineHeight: "22px",
    textTransform: "uppercase",
  }),

  bloc: css({
    position: "relative",
  }),
  borderBottomBloc: css({
    position: "absolute",
    height: 1,
    backgroundColor: globalStyles.colors.default,
    bottom: 0,
    left: 0,
    right: 0,
    "@media print": {
      borderBottom: `solid ${globalStyles.colors.default} 1px`,
      background: "none",
    },
  }),
  borderLeftBloc: css({
    position: "absolute",
    width: 1,
    backgroundColor: globalStyles.colors.default,
    bottom: 0,
    top: 0,
    left: 0,
    "@media print": {
      borderLeft: `solid ${globalStyles.colors.default} 1px`,
      background: "none",
    },
  }),

  borderBottomResult: css({
    position: "absolute",
    height: 1,
    backgroundColor: globalStyles.colors.default,
    bottom: 0,
    left: -globalStyles.grid.gutterWidth,
    right: "50%",
    "@media print": {
      borderBottom: `solid ${globalStyles.colors.default} 1px`,
      background: "none",
    },
  }),
  borderRightResult: css({
    position: "absolute",
    width: 1,
    backgroundColor: globalStyles.colors.default,
    bottom: 0,
    top: 0,
    right: "50%",
    "@media print": {
      borderRight: `solid ${globalStyles.colors.default} 1px`,
      background: "none",
    },
  }),
  blocResult: css({
    position: "relative",
    maxWidth: 250,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: "auto",
    marginLeft: globalStyles.grid.gutterWidth,
    display: "flex",
    flexDirection: "column",
    "@media print": {
      minWidth: 250,
      flexShrink: 0,
    },
  }),

  borderNoChildren: css({
    bottom: "50%",
  }),
}

export default RecapBloc
