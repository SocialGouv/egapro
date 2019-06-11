/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  onClick: () => void;
  style?: any;
}

function ActionLink({ children, onClick, style }: Props) {
  return (
    <button type="button" css={[styles.button, style]} onClick={onClick}>
      {children}
    </button>
  );
}

const styles = {
  button: css({
    all: "unset",

    padding: 0,
    border: "none",
    outline: "none",
    font: "inherit",
    color: "inherit",
    background: "none",

    cursor: "pointer",
    fontSize: 14,
    textAlign: "center",
    textDecoration: "underline"
  })
};

export default ActionLink;
