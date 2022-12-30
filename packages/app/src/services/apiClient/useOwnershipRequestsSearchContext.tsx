import { OwnershipRequestStatus } from "@common/core-domain/domain/valueObjects/ownership_request/OwnershipRequestStatus";
import type { GetOwnershipRequestInputDTO } from "@common/core-domain/dtos/OwnershipRequestDTO";
import { useListeDeclarants } from "@services/apiClient/useListeDeclarants";
import type { Dispatch, PropsWithChildren, SetStateAction } from "react";
import { createContext, useContext, useState } from "react";

export const ITEMS_PER_LOAD = 3;

const initialContext: GetOwnershipRequestInputDTO = {
  limit: ITEMS_PER_LOAD,
  offset: 0,
  orderDirection: "asc",
  orderBy: "createdAt",
  status: OwnershipRequestStatus.Enum.TO_PROCESS,
};

const OwnershipRequestsSearchContext = createContext<
  | [
      state: GetOwnershipRequestInputDTO,
      setState: Dispatch<SetStateAction<GetOwnershipRequestInputDTO>>,
      result: ReturnType<typeof useListeDeclarants>,
    ]
  | null
>(null);
OwnershipRequestsSearchContext.displayName = "OwnershipRequestsSearchContext";

export const OwnershipRequestsSearchContextProvider = ({ children }: PropsWithChildren) => {
  const [state, setState] = useState(initialContext);
  const { orderDirection, orderBy, siren, status } = state;

  const result = useListeDeclarants({ orderDirection, orderBy, siren, status }, ITEMS_PER_LOAD);

  return (
    <OwnershipRequestsSearchContext.Provider value={[state, setState, result]}>
      {children}
    </OwnershipRequestsSearchContext.Provider>
  );
};

export const useOwnershipRequestsSearchContext = () => {
  const context = useContext(OwnershipRequestsSearchContext);

  if (!context)
    throw new Error(
      "useOwnershipRequestsSearchContext must be used in a OwnershipRequestsSearchContextProvider hierarchy.",
    );

  return context;
};
