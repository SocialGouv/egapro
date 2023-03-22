import "@design-system/theme";

import { useEffect, useState } from "react";
import create from "zustand";

export interface DsfrScriptProps {
  enableJs?: boolean;
}

interface UseDsfrStore {
  dsfr(): typeof window.dsfr | null;
  loaded: boolean;
}

interface _UseDsfrStore extends UseDsfrStore {
  confirmLoaded(): void;
}

export const useDsfrStore = create<UseDsfrStore>()((set, get) => ({
  dsfr: () => (get().loaded ? window.dsfr : null),
  loaded: false,
  confirmLoaded: () => set({ loaded: true }),
}));

export const DsfrScript = ({ enableJs }: DsfrScriptProps) => {
  const [loading, setLoading] = useState(false);
  const confirmLoaded = useDsfrStore(store => (store as _UseDsfrStore).confirmLoaded);

  useEffect(() => {
    if (!enableJs || loading) return;
    setLoading(true);
    window.dsfr = {
      verbose: false,
      mode: "react",
    };
    (async () => {
      await import("@gouvfr/dsfr/dist/patch/patch.module");
      await import("@gouvfr/dsfr/dist/dsfr.module");
      window.dsfr?.start();
      confirmLoaded();
    })();
  }, [enableJs, loading, confirmLoaded]);
  return <></>;
};
