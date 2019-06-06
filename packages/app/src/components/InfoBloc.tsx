/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { ReactNode } from "react";

import { IconWarning, IconCircleCross } from "./Icons";

interface Props {
  title: string;
  text?: ReactNode;
  icon?: "warning" | "cross" | null;
}

function InfoBloc({ title, text, icon = "warning" }: Props) {
  return (
    <div css={styles.bloc}>
      <p css={styles.blocTitle}>{title}</p>
      {text && (
        <div css={styles.blocBody}>
          {icon === null ? null : (
            <div css={styles.blocIcon}>
              {icon === "cross" ? <IconCircleCross /> : <IconWarning />}
            </div>
          )}
          <p css={styles.blocText}>{text}</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  bloc: css({
    padding: 16,
    backgroundColor: "#FFF",
    border: "1px solid #EFECEF"
  }),
  blocTitle: css({
    fontSize: 18,
    lineHeight: "22px",
    textTransform: "uppercase"
  }),
  blocBody: {
    marginTop: 4,
    display: "flex",
    alignItems: "flex-end"
  },
  blocIcon: {
    marginRight: 22
  },
  blocText: css({
    fontSize: 14,
    lineHeight: "17px"
  })
};

export default InfoBloc;
