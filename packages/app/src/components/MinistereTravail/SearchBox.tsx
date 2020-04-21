/** @jsx jsx */
import { FC, useCallback } from "react";
import SearchField from "./SearchField";
import SearchButton from "./SearchButton";
import { jsx, css } from "@emotion/core";

interface SearchBoxProps {
  placeholder: string;
  onSearch: (search: string) => void;
}

const SearchBox: FC<SearchBoxProps> = ({ placeholder, onSearch }) => {
  const onSubmit = useCallback(
    event => {
      event.preventDefault();
      onSearch(event.target.elements["search"].value);
    },
    [onSearch]
  );
  return (
    <form onSubmit={onSubmit}>
      <div css={lineStyle}>
        <SearchField name="search" placeholder={placeholder} />
        <SearchButton />
      </div>
    </form>
  );
};

const lineStyle = css({
  border: "1px solid grey",
  display: "flex",
  justifyContent: "flex-start"
});

export default SearchBox;
