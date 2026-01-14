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

export type RepeqFunnelStore = State & Actions;

/**
 * 🧠 Store principal (persisté en sessionStorage)
 */
export const useRepeqFunnelStore = create<RepeqFunnelStore>()(
  persist(
    immer((set, get) => ({
      // -------- State --------
      funnel: undefined,
      isEdit: false,
      _hasHydrated: false,

      // -------- Actions --------
      setIsEdit: isEdit => set({ isEdit }),

      saveFunnel: funnel => {
        set({
          funnel: { ...get().funnel, ...funnel },
        });
      },

      resetFunnel: () =>
        set({
          funnel: undefined,
        }),

      // -------- Internal hydration flag --------
      setHasHydrated(hydrated: boolean) {
        set({
          _hasHydrated: hydrated,
        });
      },
    })),
    {
      name: "repeq-funnel-store",
      storage: createJSONStorage(() => sessionStorage),

      onRehydrateStorage: () => state => {
        // ⚠️ Zustand appelle ceci APRES hydratation
        (state as Any)?.setHasHydrated(true);
      },
    },
  ),
);

/**
 * ✅ Hook client SAFE
 * - ne retourne JAMAIS undefined
 * - ne bloque pas le render
 * - l’hydratation est gérée via `_hasHydrated`
 */
export const useRepeqFunnelClientStore = ((...args: Parameters<typeof useRepeqFunnelStore>) => {
  const store = useRepeqFunnelStore(...args);

  // Optionnel : force un render client (évite warnings SSR/CSR)
  const [, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return store;
}) as typeof useRepeqFunnelStore;

/**
 * 🔍 Hook utilitaire pour savoir si le store est prêt
 */
export const useRepeqFunnelStoreHasHydrated = () =>
  useRepeqFunnelStore(state => state._hasHydrated);
