import { type CreateRepresentationEquilibreeDTO } from "@common/core-domain/dtos/CreateRepresentationEquilibreeDTO";
import { mountStoreDevtool } from "simple-zustand-devtools";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface State {
  funnel?: Partial<CreateRepresentationEquilibreeDTO>;
  isEdit: boolean;
}

interface Actions {
  resetFunnel(): void;
  saveFunnel(form?: Partial<CreateRepresentationEquilibreeDTO>): void;
  setIsEdit(isEdit: boolean): void;
}

export type RepeqFunnelStore = Actions & State;

export const useRepeqFunnelStore = create<RepeqFunnelStore>()(
  persist(
    immer((set, get) => ({
      isEdit: false,
      setIsEdit: isEdit => set({ isEdit }),
      saveFunnel: funnel =>
        set({
          funnel: { ...get().funnel, ...funnel },
        }),
      resetFunnel: () =>
        set({
          funnel: void 0,
        }),
    })),
    {
      name: "repeq-funnel-store",
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);

if (process.env.NODE_ENV === "development") {
  mountStoreDevtool("useRepeqFunnelStore", useRepeqFunnelStore);
}
