import { useCallback } from "react";
import type { AnyFunction } from "@common/utils/types";

export function useCallbackOnMount(callback: AnyFunction) {
  return useCallback(() => {
    callback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
