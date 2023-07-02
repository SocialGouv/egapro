import { type ReferentDTO } from "@common/core-domain/dtos/ReferentDTO";
import { useEffect, useState } from "react";
import { create, type StoreApi, type UseBoundStore } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const columnMap = [
  ["region", "Région"],
  ["county", "Département"],
  ["name", "Nom"],
  ["value", "Valeur"],
  ["principal", "Principal"],
] as const;

type OrderBy = (typeof columnMap)[number][0];

interface State {
  currentEdited?: ReferentDTO;
  orderBy: OrderBy;
  orderDirection: "asc" | "desc";
}

interface PrivateState {
  _hasHydrated: boolean;
}

type Actions = {
  setCurrentEdited: (referent?: ReferentDTO) => void;
  togglerOrderColumn: (columnValue: OrderBy) => void;
};

type PrivateActions = {
  setHasHydrated: (hydrated: boolean) => void;
};

export type ReferentListStore = Actions & State;

type PrivateReferentListStore = PrivateActions & PrivateState & ReferentListStore;
type UseReferentListStore = UseBoundStore<StoreApi<ReferentListStore>>;

const usePrivateReferentListStore = create<PrivateReferentListStore>()(
  persist(
    immer(set => ({
      orderBy: "region",
      orderDirection: "asc",
      _hasHydrated: false,
      togglerOrderColumn: columnValue =>
        set(state => {
          if (state.orderBy === columnValue) {
            state.orderDirection = state.orderDirection === "asc" ? "desc" : "asc";
          } else {
            state.orderBy = columnValue;
            state.orderDirection = "desc";
          }
        }),
      setCurrentEdited: referent => set({ currentEdited: referent }),
      setHasHydrated(hydrated: boolean) {
        set({
          _hasHydrated: hydrated,
        });
      },
    })),
    {
      name: "referent-list",
      onRehydrateStorage: () => state => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export const useReferentListStore = usePrivateReferentListStore as UseReferentListStore;

export const useReferentListClientStore = ((...args: Parameters<typeof useReferentListStore>) => {
  const result = useReferentListStore(...args);
  const [hasMounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (hasMounted) return result;
}) as typeof useReferentListStore;

export const useReferentListStoreHasHydrated = () =>
  (useReferentListClientStore as typeof usePrivateReferentListStore)(state => state._hasHydrated);
