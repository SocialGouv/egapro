/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { ReactNode } from "react";

import globalStyles from "../../../utils/globalStyles";

import ResultBubble, {
  Props as ResultBubbleProps
} from "../../../components/ResultBubble";

import { useColumnsWidth } from "../../../components/GridContext";

interface Props {
  title: string;
  children: ReactNode;
  resultBubble: ResultBubbleProps;
}

export function RecapBloc({ title, children, resultBubble }: Props) {
  const width = useColumnsWidth(4);

  return (
    <div css={styles.container}>
      {/*<div css={styles.background} />*/}

      {/*<div css={styles.blocForm}>
        <div css={styles.blocFormInner}>{children}</div>
  </div>*/}
      <div css={[styles.blocInfo, css({ width })]}>
        <div css={styles.title}>{title}</div>
      </div>

      <div css={styles.blocResult}>
        <div css={styles.borderResult} />
        <ResultBubble {...resultBubble} />
      </div>
    </div>
  );
}

const PADDING = 20;

const styles = {
  container: css({
    position: "relative",
    // marginTop: 50 + 14,
    // marginBottom: 20 + 14,

    display: "flex",
    flexDirection: "row"
  }),
  background: css({
    backgroundColor: "#FFF",
    position: "absolute",
    top: -50,
    bottom: -20,
    left: -38,
    right: -38,
    borderRadius: "100%",
    border: "1px solid #EFECEF"
  }),

  blocInfo: css({
    flexShrink: 0,
    paddingRight: globalStyles.grid.gutterWidth,
    paddingLeft: globalStyles.grid.gutterWidth,
    borderLeft: `solid ${globalStyles.colors.default} 1px`,
    borderBottom: `solid ${globalStyles.colors.default} 1px`
  }),
  title: css({
    fontSize: 18,
    lineHeight: "22px",
    textTransform: "uppercase"
  }),

  blocForm: css({
    position: "relative",
    borderLeft: `solid ${globalStyles.colors.default} 1px`,
    borderBottom: `solid ${globalStyles.colors.default} 1px`,
    paddingTop: 8,
    paddingBottom: 8
  }),
  blocFormInner: css({
    paddingRight: PADDING,
    paddingLeft: PADDING
  }),

  borderResult: css({
    position: "absolute",
    height: 1,
    backgroundColor: globalStyles.colors.default,
    bottom: 0,
    left: -globalStyles.grid.gutterWidth,
    right: "50%"
  }),
  blocResult: css({
    position: "relative",
    maxWidth: 250,
    flex: 1,
    marginLeft: globalStyles.grid.gutterWidth,
    display: "flex",
    flexDirection: "column"
  })
};

export default RecapBloc;
