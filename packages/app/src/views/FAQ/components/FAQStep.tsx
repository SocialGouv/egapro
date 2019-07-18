/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { ReactNode } from "react";

function FAQStep({ children, icon }: { children: ReactNode; icon: ReactNode }) {
  return (
    <div css={styles.container}>
      <div css={styles.background}>
        <span css={styles.text}>{children}</span>
      </div>
      <div css={styles.iconContainer}>{icon}</div>
    </div>
  );
}

const styles = {
  container: css({
    position: "relative",
    marginBottom: 12,
    paddingLeft: 27
  }),
  background: css({
    backgroundColor: "#F9F7F9",
    borderRadius: 5,
    padding: "10px 18px 10px 27px"
  }),
  text: css({
    fontSize: 14,
    lineHeight: "17px"
  }),
  iconContainer: {
    left: 0,
    top: "50%",
    position: "absolute" as "absolute", // Because typescript…
    marginTop: -22,
    width: 44,
    height: 44
  }
};

export default FAQStep;
