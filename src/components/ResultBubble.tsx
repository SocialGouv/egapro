/** @jsx jsx */
import { css, jsx } from "@emotion/core";

import globalStyles from "../utils/globalStyles";

interface Props {
  firstLineLabel: string;
  firstLineData: string;
  firstLineInfo: string;
  secondLineLabel: string;
  secondLineData: string;
  secondLineInfo: string;
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
        <div>
          <p css={styles.message}>
            <span css={styles.messageLabel}>{firstLineLabel} </span>
            <span css={styles.messageData}>{firstLineData}</span>
          </p>
          <p css={styles.info}>{firstLineInfo}</p>
        </div>

        <div>
          <p css={styles.message}>
            <span css={styles.messageLabel}>{secondLineLabel} </span>
            <span css={styles.messageData}>{secondLineData}</span>
          </p>
          <p css={styles.info}>{secondLineInfo}</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: css({
    marginTop: 64,
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
  message: css({
    marginBottom: 9,
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
    fontSize: 12,
    fontStyle: "italic",
    lineHeight: "15px",

    borderBottom: "1px solid #FFFFFF"
  })
};

export default ResultBubble;
