/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { ReactNode } from "react";

import globalStyles from "../utils/globalStyles";

import { IconWarning, IconCircleCross } from "./Icons";
import { useColumnsWidth, useLayoutType } from "./GridContext";

interface Props {
  title: string;
  text?: ReactNode;
  icon?: "warning" | "cross" | null;
}

function InfoBloc({ title, text, icon = "warning" }: Props) {
  const layoutType = useLayoutType();
  const width = useColumnsWidth(layoutType === "desktop" ? 6 : 7);
  return (
    <div css={[styles.bloc, css({ width })]}>
      {icon === null ? null : (
        <div css={styles.blocIcon}>
          {icon === "cross" ? <IconCircleCross /> : <IconWarning />}
        </div>
      )}

      <div>
        <p css={styles.blocTitle}>{title}</p>
        {text && <p css={styles.blocText}>{text}</p>}
      </div>
    </div>
  );
}

const styles = {
  bloc: css({
    padding: "12px 18px",
    display: "flex",
    alignItems: "center",
    backgroundColor: globalStyles.colors.primary,
    borderRadius: 5
  }),
  blocTitle: css({
    fontSize: 18,
    lineHeight: "22px",
    textTransform: "uppercase",
    color: "white"
  }),
  blocIcon: {
    marginRight: 22,
    color: "white"
  },
  blocText: css({
    marginTop: 4,
    fontSize: 14,
    lineHeight: "17px",
    color: "white"
  })
};

export default InfoBloc;
