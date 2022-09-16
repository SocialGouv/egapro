import { useCallback } from "react"

export function useCallbackOnMount(callback: Function) {
  return useCallback(() => {
    callback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
