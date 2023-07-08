import { type CreateSimulationDTO } from "@common/core-domain/dtos/CreateSimulationDTO";
import { useEffect, useState } from "react";
import { create, type StoreApi, type UseBoundStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface State {
  funnel?: Partial<CreateSimulationDTO>;
  isEdit: boolean;
}

interface PrivateState {
  _hasHydrated: boolean;
}

interface Actions {
  resetFunnel(): void;
  saveFunnel(form?: Partial<CreateSimulationDTO>): void;
  setIsEdit(isEdit: boolean): void;
}

type PrivateActions = {
  setHasHydrated: (hydrated: boolean) => void;
};

export type SimuFunnelStore = Actions & State;

type PrivateSimuFunnelStore = PrivateActions & PrivateState & SimuFunnelStore;
type UseSimuFunnelStore = UseBoundStore<StoreApi<SimuFunnelStore>>;

const usePrivateSimuFunnelStore = create<PrivateSimuFunnelStore>()(
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
      setHasHydrated(hydrated: boolean) {
        set({
          _hasHydrated: hydrated,
        });
      },
    })),
    {
      name: "simu-funnel-store",
      storage: createJSONStorage(() => sessionStorage),
      onRehydrateStorage: () => state => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export const useSimuFunnelStore = usePrivateSimuFunnelStore as UseSimuFunnelStore;

export const useSimmuFunnelClientStore = ((...args: Parameters<typeof useSimuFunnelStore>) => {
  const result = useSimuFunnelStore(...args);
  const [hasMounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (hasMounted) return result;
}) as typeof useSimuFunnelStore;

export const useSimuFunnelStoreHasHydrated = () =>
  (useSimmuFunnelClientStore as typeof usePrivateSimuFunnelStore)(state => state._hasHydrated);
