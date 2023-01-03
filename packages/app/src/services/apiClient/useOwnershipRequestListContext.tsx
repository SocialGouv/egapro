import { OwnershipRequestStatus } from "@common/core-domain/domain/valueObjects/ownership_request/OwnershipRequestStatus";
import type { GetOwnershipRequestInputDTO } from "@common/core-domain/dtos/OwnershipRequestDTO";
import { useListeDeclarants } from "@services/apiClient/useListeDeclarants";
import type { Dispatch, PropsWithChildren, SetStateAction } from "react";
import { createContext, useContext, useEffect, useState } from "react";

export const ITEMS_PER_LOAD = 3;

type OwnershipRequestListContextType = GetOwnershipRequestInputDTO & { checkedItems: string[]; globalCheck: boolean };

const initialContext: OwnershipRequestListContextType = {
  limit: ITEMS_PER_LOAD,
  offset: 0,
  orderDirection: "asc",
  orderBy: "createdAt",
  status: OwnershipRequestStatus.Enum.TO_PROCESS,
  siren: "",
  checkedItems: [],
  globalCheck: false,
};

const OwnershipRequestListContext = createContext<
  | [
      formState: OwnershipRequestListContextType,
      setFormState: Dispatch<SetStateAction<OwnershipRequestListContextType>>,
      result: ReturnType<typeof useListeDeclarants>,
    ]
  | null
>(null);
OwnershipRequestListContext.displayName = "OwnershipRequestListContext";

export const OwnershipRequestListContextProvider = ({ children }: PropsWithChildren) => {
  const [formState, setFormState] = useState(initialContext);
  const { orderDirection, orderBy, siren, status } = formState;

  // TODO: gérer le page number et la pagination
  const result = useListeDeclarants({ orderDirection, orderBy, siren, status }, ITEMS_PER_LOAD, 0);

  // Anytime user change inputs and submit, we must reset the checkboxes.
  useEffect(() => {
    setFormState(state => ({ ...state, checkedItems: [], globalCheck: false }));
  }, [siren, status]);

  return (
    <OwnershipRequestListContext.Provider value={[formState, setFormState, result]}>
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
