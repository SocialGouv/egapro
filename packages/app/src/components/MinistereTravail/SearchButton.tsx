/** @jsx jsx */
import {FC, MouseEventHandler} from "react";
import {IconSearch} from "../Icons";
import {css, jsx} from "@emotion/core";
import {GREEN} from "./colors";

interface SearchButtonProps {
  onClick: MouseEventHandler
}

const SearchButton: FC<SearchButtonProps> = ({ onClick }) => (
  <button onClick={onClick} css={styles.searchButton}>
    <IconSearch/>
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


export default SearchButton;
