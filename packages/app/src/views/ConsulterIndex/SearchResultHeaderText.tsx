/** @jsx jsx */
import { jsx } from "@emotion/core";
import { FC } from "react";
import WarningMessage from "../../components/MinistereTravail/WarningMessage";

interface SearchResultHeaderText {
  searchResults: any[];
  searchTerms: string;
  loading: boolean;
}

const SearchResultHeaderText: FC<SearchResultHeaderText> = ({
  searchResults,
  searchTerms,
  loading
}) => (
  <WarningMessage>
    {loading
      ? "Chargement en cours ..."
      : searchResults.length > 0 && !loading
      ? `Résultats de recherche pour “${searchTerms}”`
      : `Aucun résultat ne correspond à la recherche “${searchTerms}”`}
  </WarningMessage>
);

export default SearchResultHeaderText;
