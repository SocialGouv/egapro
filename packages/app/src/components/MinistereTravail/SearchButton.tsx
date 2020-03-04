/** @jsx jsx */
import {FC, MouseEventHandler} from "react";
import {IconSearch} from "../Icons";
import {jsx} from "@emotion/core";
import Button from "./Button";

interface SearchButtonProps {
  onClick: MouseEventHandler
}

const SearchButton: FC<SearchButtonProps> = ({ onClick }) => (
  <Button onClick={onClick}>
    <IconSearch/>
  </Button>
);

export default SearchButton;
