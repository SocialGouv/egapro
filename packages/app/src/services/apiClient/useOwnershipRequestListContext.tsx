import { OwnershipRequestStatus } from "@common/core-domain/domain/valueObjects/ownership_request/OwnershipRequestStatus";
import type { GetOwnershipRequestInputDTO } from "@common/core-domain/dtos/OwnershipRequestDTO";
import type { Dispatch, PropsWithChildren, SetStateAction } from "react";
import { createContext, useContext, useEffect, useState } from "react";

export const ITEMS_PER_PAGE = 10;

// Limit and offset are low level. They are replaced by pageSize and pageNumber for convenience.
type OwnershipRequestListContextType = Omit<GetOwnershipRequestInputDTO, "limit" | "offset"> & {
  checkedItems: string[];
  globalCheck: boolean;
  pageNumber: number;
  pageSize: number;
};

const initialContext: OwnershipRequestListContextType = {
  pageSize: ITEMS_PER_PAGE,
  pageNumber: 0,
  orderDirection: "asc",
  orderBy: "createdAt",
  status: OwnershipRequestStatus.Enum.TO_PROCESS,
  siren: "",
  checkedItems: [],
  globalCheck: false,
};

/**
 * Context to store all UI state, using to fetch and store the checked items.
 */
const OwnershipRequestListContext = createContext<{
  formState: OwnershipRequestListContextType;
  setFormState: Dispatch<SetStateAction<OwnershipRequestListContextType>>;
} | null>(null);
OwnershipRequestListContext.displayName = "OwnershipRequestListContext";

export const OwnershipRequestListContextProvider = ({ children }: PropsWithChildren) => {
  const [formState, setFormState] = useState(initialContext);
  const { siren, status } = formState;

  // Anytime user changes form inputs and submits, we must reset the checkboxes and get back to first page.
  useEffect(() => {
    setFormState(state => ({ ...state, pageNumber: 0, checkedItems: [], globalCheck: false }));
  }, [siren, status]);

  return (
    <OwnershipRequestListContext.Provider value={{ formState, setFormState }}>
      {children}
    </OwnershipRequestListContext.Provider>
  );
};

export const useOwnershipRequestListContext = () => {
  const context = useContext(OwnershipRequestListContext);

  if (!context)
    throw new Error("useOwnershipRequestListContext must be used in a OwnershipRequestListContextProvider hierarchy.");

  return context;
};
