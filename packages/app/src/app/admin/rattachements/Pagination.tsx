"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import {
  type GetOwnershipRequestDTO,
  type GetOwnershipRequestInputSchemaDTO,
} from "@common/core-domain/dtos/OwnershipRequestDTO";
import { useEffect } from "react";

import { type OwnershipRequestListStoreType, useOwnershipRequestListStore } from "./useOwnershipRequestListStore";

type Props = {
  className?: string;
  fetchedItems?: GetOwnershipRequestDTO;
};

const ITEMS_PER_PAGE = 10;

export type SearchParams = Partial<Omit<OwnershipRequestListStoreType["formState"], "checkedItems" | "globalCheck">>;

export const buildKey = (search?: SearchParams) => {
  if (!search) return null;

  const { orderBy, orderDirection, query, status, pageNumber, pageSize } = search;

  const limit = pageSize || ITEMS_PER_PAGE;
  const offset = pageNumber ? pageNumber * limit : 0;

  const params = new URLSearchParams({
    ...(search.orderBy && { orderBy }),
    ...(search.orderDirection && { orderDirection }),
    ...(search.query && { query }),
    ...(search.status && { status }),
    limit: String(limit),
    offset: String(offset),
  } as GetOwnershipRequestInputSchemaDTO);

  return `${params.toString()}`;
};

export const Pagination = ({ className, fetchedItems }: Props) => {
  const formState = useOwnershipRequestListStore(state => state.formState);
  const firstPage = useOwnershipRequestListStore(state => state.firstPage);
  const nextPage = useOwnershipRequestListStore(state => state.nextPage);
  const previousPage = useOwnershipRequestListStore(state => state.previousPage);

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
  }, [fetchedItems, firstPage, formState]);

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
        <Button disabled={!canGoToPreviousPage} onClick={previousPage}>
          Précédent
        </Button>
        <Button priority="tertiary" disabled={!canGoToNextPage} onClick={nextPage}>
          Suivant
        </Button>
      </div>
    </nav>
  );
};
