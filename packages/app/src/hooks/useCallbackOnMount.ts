import type { AnyFunction } from "@common/utils/types";
import { useCallback } from "react";

export function useCallbackOnMount(callback: AnyFunction) {
  return useCallback(() => {
    callback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
