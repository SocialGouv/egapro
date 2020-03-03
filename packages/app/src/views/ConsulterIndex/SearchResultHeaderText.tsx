/** @jsx jsx */
import { jsx} from "@emotion/core";
import { FC } from "react";
import WarningMessage from "../../components/MinistereTravail/WarningMessage";

interface SearchResultHeaderText {
  searchResults: any[];
  searchTerms: string;
}

const SearchResultHeaderText: FC<SearchResultHeaderText> = ({ searchResults, searchTerms }) => (
  <WarningMessage>
    {
      searchResults.length > 0 ?
        `Résultats de recherche pour “${searchTerms}”` :
        `Aucun résultat ne correspond à la recherche “${searchTerms}”`
    }
  </WarningMessage>
);

export default SearchResultHeaderText;
