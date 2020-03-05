/** @jsx jsx */
import { FC } from "react";
import { css, jsx } from "@emotion/core";
import { GREEN } from "./colors";

const WarningMessage: FC = ({ children }) => (
  <h3 css={style}>
    {children}
  </h3>
);

const style = css({
  fontWeight: "normal",
  fontSize: "24px",
  color: GREEN
});

export default WarningMessage;
