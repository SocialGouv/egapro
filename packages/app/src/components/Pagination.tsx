import { useListeDeclarants } from "@services/apiClient/useListeDeclarants";
import { useOwnershipRequestListStore } from "@services/apiClient/useOwnershipRequestListStore";
import { useEffect } from "react";

import { ButtonGroup } from "../design-system/base/ButtonGroup";
import { FormButton } from "../design-system/base/FormButton";

type Props = {
  className?: string;
};

export const Pagination = ({ className }: Props) => {
  const formState = useOwnershipRequestListStore(state => state.formState);
  const firstPage = useOwnershipRequestListStore(state => state.firstPage);
  const nextPage = useOwnershipRequestListStore(state => state.nextPage);
  const previousPage = useOwnershipRequestListStore(state => state.previousPage);

  const { fetchedItems } = useListeDeclarants(formState);
  const { pageSize, pageNumber } = formState;

  const totalCount = fetchedItems?.totalCount || 0;

  const totalPages = Math.ceil(totalCount / (pageSize || 1));

  const canGoToPreviousPage = pageNumber > 0;
  const canGoToNextPage = pageNumber < totalPages - 1;

  const firstElement = pageNumber * pageSize + 1;
  const lastElement = firstElement + (fetchedItems?.data.length || 0) - 1;

  useEffect(() => {
    // User has an empty page for some reasons (ex: user checks all items in last page), get back to first page.
    if (fetchedItems && fetchedItems.data.length === 0 && formState.pageNumber > 0) {
      firstPage();
    }
  }, [fetchedItems, firstPage, formState.pageNumber]);

  return (
    <nav aria-label="Pagination" className={className}>
      <div>
        <p>
          {totalCount === 0 ? (
            "Aucun résultat"
          ) : totalCount === 1 ? (
            "1 résultat"
          ) : (
            <>
              Éléments <span>{firstElement}</span> à <span>{lastElement}</span> sur <span>{totalCount}</span>
            </>
          )}
        </p>
      </div>
      <div>
        <ButtonGroup inline="mobile-up" className="fr-mb-4w">
          <FormButton disabled={!canGoToPreviousPage} onClick={previousPage}>
            Précédent
          </FormButton>
          <FormButton disabled={!canGoToNextPage} variant="tertiary" onClick={nextPage}>
            Suivant
          </FormButton>
        </ButtonGroup>
      </div>
    </nav>
  );
};
