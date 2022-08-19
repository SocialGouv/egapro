import React from "react"

export function useCallbackOnMount(callback: Function) {
  return React.useCallback(() => {
    callback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
