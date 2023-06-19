import { type CreateRepresentationEquilibreeDTO } from "@common/core-domain/dtos/CreateRepresentationEquilibreeDTO";
import { type Any } from "@common/utils/types";
import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface State {
  _hasHydrated: boolean;
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
      _hasHydrated: false,
      setIsEdit: isEdit => set({ isEdit }),
      saveFunnel: funnel =>
        set({
          funnel: { ...get().funnel, ...funnel },
        }),
      resetFunnel: () =>
        set({
          funnel: void 0,
        }),
      ...{
        setHasHydrated(hydrated: boolean) {
          set({
            _hasHydrated: hydrated,
          });
        },
      },
    })),
    {
      name: "repeq-funnel-store",
      storage: createJSONStorage(() => sessionStorage),
      onRehydrateStorage: () => state => {
        (state as Any).setHasHydrated(true);
      },
    },
  ),
);

export const useRepeqFunnelClientStore = ((...args: Parameters<typeof useRepeqFunnelStore>) => {
  const result = useRepeqFunnelStore(...args);
  const [hasMounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (hasMounted) return result;
}) as typeof useRepeqFunnelStore;

export const useRepeqFunnelStoreHasHydrated = () => useRepeqFunnelClientStore(state => state._hasHydrated);
