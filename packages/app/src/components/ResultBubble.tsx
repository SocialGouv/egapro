/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import globalStyles from "../utils/globalStyles";

export interface Props {
  firstLineLabel: string;
  firstLineData: string;
  firstLineInfo?: string;
  secondLineLabel: string;
  secondLineData: string;
  secondLineInfo?: string;
}

function ResultBubble({
  firstLineLabel,
  firstLineData,
  firstLineInfo,
  secondLineLabel,
  secondLineData,
  secondLineInfo
}: Props) {
  return (
    <div css={styles.container}>
      <div css={styles.bloc}>
        <div css={styles.blocInfo}>
          <p css={styles.message}>
            <span css={styles.messageLabel}>{firstLineLabel} </span>
            <span css={styles.messageData}>{firstLineData}</span>
          </p>
          {firstLineInfo && <p css={styles.info}>{firstLineInfo}</p>}
        </div>

        <div css={styles.blocInfo}>
          <p css={styles.message}>
            <span css={styles.messageLabel}>{secondLineLabel} </span>
            <span css={styles.messageData}>{secondLineData}</span>
          </p>
          {secondLineInfo && <p css={styles.info}>{secondLineInfo}</p>}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: css({
    width: "100%",
    position: "relative",
    height: 0,
    paddingTop: "100%"
  }),
  bloc: css({
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,

    padding: "26% 8%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",

    color: "white",
    backgroundColor: globalStyles.colors.default,
    borderRadius: "100%"
  }),
  blocInfo: css({
    borderBottom: "1px solid #FFFFFF"
  }),
  message: css({
    marginBottom: 2,
    display: "flex",
    alignItems: "baseline",

    fontSize: 14,
    lineHeight: "17px"
  }),
  messageLabel: css({
    marginRight: "auto"
  }),
  messageData: css({
    fontWeight: "bold"
  }),
  info: css({
    marginTop: 7,
    fontSize: 12,
    fontStyle: "italic",
    lineHeight: "15px"
  })
};

export default ResultBubble;
