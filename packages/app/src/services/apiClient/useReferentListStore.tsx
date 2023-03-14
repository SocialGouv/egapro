import type { ReferentDTO } from "@common/core-domain/dtos/ReferentDTO";
import { mountStoreDevtool } from "simple-zustand-devtools";
import create from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const columnMap = [
  ["region", "Région"],
  ["county", "Département"],
  ["name", "Nom"],
  ["value", "Valeur"],
  ["principal", "Principal"],
] as const;

type OrderBy = typeof columnMap[number][0];

export type ReferentListStore = {
  currentEdited?: ReferentDTO;
  orderBy: OrderBy;
  orderDirection: "asc" | "desc";
  setCurrentEdited: (referent?: ReferentDTO) => void;
  togglerOrderColumn: (columnValue: OrderBy) => void;
};

export const useReferentListStore = create<ReferentListStore>()(
  persist(
    immer(set => ({
      orderBy: "region",
      orderDirection: "asc",
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
    })),
    {
      name: "referent-list",
    },
  ),
);

if (process.env.NODE_ENV === "development") {
  mountStoreDevtool("useReferentListStore", useReferentListStore);
}
