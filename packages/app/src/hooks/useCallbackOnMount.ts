import React from "react";
import type { AnyFunction } from "@common/utils/types";

export function useCallbackOnMount(callback: AnyFunction) {
  return React.useCallback(() => {
    callback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
