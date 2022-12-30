import { OwnershipRequestStatus } from "@common/core-domain/domain/valueObjects/ownership_request/OwnershipRequestStatus";
import type { GetOwnershipRequestInputDTO } from "@common/core-domain/dtos/OwnershipRequestDTO";
import { useListeDeclarants } from "@services/apiClient/useListeDeclarants";
import type { Dispatch, PropsWithChildren, SetStateAction } from "react";
import { createContext, useContext, useState } from "react";

export const ITEMS_PER_LOAD = 3;

type OwnershipRequestListContextType = GetOwnershipRequestInputDTO & { checkedItems: string[] };

const initialContext: OwnershipRequestListContextType = {
  limit: ITEMS_PER_LOAD,
  offset: 0,
  orderDirection: "asc",
  orderBy: "createdAt",
  status: OwnershipRequestStatus.Enum.TO_PROCESS,
  checkedItems: [],
};

const OwnershipRequestListContext = createContext<
  | [
      state: OwnershipRequestListContextType,
      setState: Dispatch<SetStateAction<OwnershipRequestListContextType>>,
      result: ReturnType<typeof useListeDeclarants>,
    ]
  | null
>(null);
OwnershipRequestListContext.displayName = "OwnershipRequestListContext";

export const OwnershipRequestListContextProvider = ({ children }: PropsWithChildren) => {
  const [state, setState] = useState(initialContext);
  const { orderDirection, orderBy, siren, status } = state;

  const result = useListeDeclarants({ orderDirection, orderBy, siren, status }, ITEMS_PER_LOAD);

  return (
    <OwnershipRequestListContext.Provider value={[state, setState, result]}>
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
