/** @jsx jsx */
import { FC, MouseEventHandler } from "react";
import { css, jsx } from "@emotion/core";
import searchIconUrl from "./SearchIcon.svg";

interface SearchButtonProps {
  onClick?: MouseEventHandler;
}

const SearchButton: FC<SearchButtonProps> = ({ onClick }) => (
  <button css={searchButtonStyle} onClick={onClick}>
    <img css={searchIconStyle} src={searchIconUrl} alt="rechercher" />
  </button>
);

const searchButtonStyle = css({
  width: "40px",
  height: "40px",
  padding: 0,
  border: "unset",
  cursor: "pointer",
  backgroundColor: "transparent"
});

const searchIconStyle = css({
  width: "100%",
  height: "100%"
});

export default SearchButton;
