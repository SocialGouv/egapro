/** @jsx jsx */
import { FC, MouseEventHandler } from "react";
import { css, jsx } from "@emotion/core";
import { GREEN } from "./colors";

interface SearchButtonProps {
  onClick: MouseEventHandler;
}

const Button: FC<SearchButtonProps> = ({ onClick, children }) => (
  <button onClick={onClick} css={styles.searchButton}>
    {children}
  </button>
);

const styles = {
  searchButton: css({
    color: "white",
    backgroundColor: GREEN,
    cursor: "pointer",
    border: 0,
    ":hover": {
      filter: "brightness(120%)"
    }
  })
};

export default Button;
