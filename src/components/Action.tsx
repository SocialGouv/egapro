/** @jsx jsx */
import { css, jsx } from "@emotion/core";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  onClick: () => void;
}

function Action({ children, onClick }: Props) {
  return (
    <button css={styles.button} onClick={onClick}>
      {children}
    </button>
  );
}

const styles = {
  button: css({
    all: "unset",
    cursor: "pointer",
    fontSize: 14,
    textAlign: "center",
    textDecoration: "underline"
  })
};

export default Action;
