import { useListeDeclarants } from "@services/apiClient/useListeDeclarants";
import { useOwnershipRequestListContext } from "@services/apiClient/useOwnershipRequestListContext";

import { ButtonGroup } from "../design-system/base/ButtonGroup";
import { FormButton } from "../design-system/base/FormButton";

type Props = {
  className?: string;
};

export const Pagination = ({ className }: Props) => {
  const { formState, setFormState } = useOwnershipRequestListContext();
  const { pageSize, orderDirection, orderBy, siren, status, pageNumber } = formState;

  const { requests } = useListeDeclarants({
    orderDirection,
    orderBy,
    siren,
    status,
    pageSize,
    pageNumber,
  });

  const totalCount = requests?.totalCount || 0;

  const totalPages = Math.ceil(totalCount / (pageSize || 1));

  const canGoToPreviousPage = pageNumber > 0;
  const canGoToNextPage = pageNumber < totalPages - 1;

  const firstElement = pageNumber * pageSize + 1;
  const lastElement = firstElement + (requests?.data.length || 0) - 1;

  const goToNextPage = () => {
    // Anytime the page number changes, we must also reset the checkboxes.
    setFormState(state => ({ ...state, pageNumber: pageNumber + 1, checkedItems: [], globalCheck: false }));
  };
  const goToPreviousPage = () => {
    // Anytime the page number changes, we must also reset the checkboxes.
    setFormState(state => ({ ...state, pageNumber: pageNumber - 1, checkedItems: [], globalCheck: false }));
  };

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
              Éléments <span>{firstElement}</span> à <span>{lastElement}</span> des <span>{totalCount}</span> résultats
            </>
          )}
        </p>
      </div>
      <div>
        <ButtonGroup inline="mobile-up" className="fr-mb-4w">
          <FormButton disabled={!canGoToPreviousPage} onClick={goToPreviousPage}>
            Précédent
          </FormButton>
          <FormButton disabled={!canGoToNextPage} variant="tertiary" onClick={goToNextPage}>
            Suivant
          </FormButton>
        </ButtonGroup>
      </div>
    </nav>
  );
};
