import { CompanyWorkforceRange } from "@common/core-domain/domain/valueObjects/declaration/CompanyWorkforceRange";
import { type CreateSimulationDTO } from "@common/core-domain/dtos/CreateSimulationDTO";
import { type Any, type DeepPartial } from "@common/utils/types";
import { useEffect, useState } from "react";
import { create, type StoreApi, type UseBoundStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

interface State {
  funnel?: Partial<CreateSimulationDTO>;
  isEdit: boolean;
  selectedWorkforceRange: CompanyWorkforceRange.Enum;
}

interface PrivateState {
  _hasHydrated: boolean;
}

interface Actions {
  resetFunnel(): void;
  saveFunnel(form?: DeepPartial<CreateSimulationDTO>): void;
  setIsEdit(isEdit: boolean): void;
  setSelectedCompanyWorkforceRange(workforceRange: CompanyWorkforceRange.Enum): void;
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
      selectedWorkforceRange: CompanyWorkforceRange.Enum.FROM_50_TO_250,
      setIsEdit: isEdit => set({ isEdit }),
      saveFunnel: funnel =>
        set({
          funnel: { ...get().funnel, ...(funnel as Any) },
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
      setSelectedCompanyWorkforceRange(workforceRange) {
        set({
          selectedWorkforceRange: workforceRange,
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

export const useSimuFunnelClientStore = ((...args: Parameters<typeof useSimuFunnelStore>) => {
  const result = useSimuFunnelStore(...args);
  const [hasMounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (hasMounted) return result;
}) as typeof useSimuFunnelStore;

export const useSimuFunnelStoreHasHydrated = () =>
  (useSimuFunnelClientStore as typeof usePrivateSimuFunnelStore)(state => state._hasHydrated);
