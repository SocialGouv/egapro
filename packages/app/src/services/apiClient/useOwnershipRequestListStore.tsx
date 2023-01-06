import { OwnershipRequestStatus } from "@common/core-domain/domain/valueObjects/ownership_request/OwnershipRequestStatus";
import type {
  GetOwnershipRequestDTO,
  GetOwnershipRequestInputOrderBy,
  GetOwnershipRequestInputSchemaDTO,
} from "@common/core-domain/dtos/OwnershipRequestDTO";
import { mountStoreDevtool } from "simple-zustand-devtools";
import create from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

export const ITEMS_PER_PAGE = 10;

// Limit and offset are low level. They are replaced by pageSize and pageNumber for convenience.
export type OwnershipRequestListStoreType = {
  firstPage: () => void;
  formState: {
    checkedItems: string[];
    globalCheck: boolean;
    orderBy?: GetOwnershipRequestInputSchemaDTO["orderBy"];
    orderDirection?: GetOwnershipRequestInputSchemaDTO["orderDirection"];
    pageNumber: number;
    pageSize: number;
    siren?: string;
    status?: OwnershipRequestStatus.Enum;
  };
  nextPage: () => void;
  previousPage: () => void;
  reset: () => void;
  submit: ({ siren, status }: { siren: string; status: OwnershipRequestStatus.Enum }) => void;
  toggleAll: (requests: GetOwnershipRequestDTO | undefined) => void;
  toggleItem: ({ id, checked }: { checked: boolean; id: string }) => void;
  togglerOrderColumn: (columnValue: GetOwnershipRequestInputOrderBy) => void;
};

export const initialStore: OwnershipRequestListStoreType["formState"] = {
  pageSize: ITEMS_PER_PAGE,
  pageNumber: 0,
  orderDirection: "asc",
  orderBy: "createdAt",
  status: OwnershipRequestStatus.Enum.TO_PROCESS,
  siren: "",
  checkedItems: [],
  globalCheck: false,
};

export const useOwnershipRequestListStore = create<OwnershipRequestListStoreType>()(
  devtools(
    immer(set => ({
      formState: initialStore,
      reset: () =>
        set(state => {
          state.formState = initialStore;
        }),
      submit: ({ siren, status }: { siren: string; status: OwnershipRequestStatus.Enum }) =>
        set(state => {
          if (siren !== state.formState.siren || status !== state.formState.status) {
            state.formState.siren = siren;
            state.formState.status = status;
            state.formState.pageNumber = 0;
            state.formState.checkedItems = [];
            state.formState.globalCheck = false;
          }
        }),
      toggleItem: ({ id, checked }: { checked: boolean; id: string }) =>
        set(state => {
          if (checked) {
            state.formState.checkedItems = [...state.formState.checkedItems, id];
          } else {
            state.formState.checkedItems = state.formState.checkedItems.filter(item => item !== id);
          }
        }),
      toggleAll: (requests: GetOwnershipRequestDTO | undefined) =>
        set(state => {
          if (state.formState.globalCheck) {
            state.formState.checkedItems = [];
            state.formState.globalCheck = false;
          } else {
            state.formState.checkedItems =
              requests?.data.filter(r => r.status === OwnershipRequestStatus.Enum.TO_PROCESS).map(r => r.id) ?? [];
            state.formState.globalCheck = true;
          }
        }),
      togglerOrderColumn: (columnValue: GetOwnershipRequestInputOrderBy) =>
        set(state => {
          if (state.formState.orderBy === columnValue) {
            state.formState.orderDirection = state.formState.orderDirection === "asc" ? "desc" : "asc";
          } else {
            state.formState.orderBy = columnValue;
            state.formState.orderDirection = "desc";
          }
        }),
      nextPage: () =>
        set(state => {
          state.formState.pageNumber = state.formState.pageNumber + 1;
          state.formState.checkedItems = [];
          state.formState.globalCheck = false;
        }),
      previousPage: () =>
        set(state => {
          state.formState.pageNumber = state.formState.pageNumber - 1;
          state.formState.checkedItems = [];
          state.formState.globalCheck = false;
        }),
      firstPage: () =>
        set(state => {
          state.formState.pageNumber = 0;
        }),
    })),
  ),
);

if (process.env.NODE_ENV === "development") {
  mountStoreDevtool("useOwnershipRequestListStore", useOwnershipRequestListStore);
}
