import type { AnyFunction } from "@common/utils/types";
import React from "react";

export function useCallbackOnMount(callback: AnyFunction) {
  return React.useCallback(() => {
    callback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
