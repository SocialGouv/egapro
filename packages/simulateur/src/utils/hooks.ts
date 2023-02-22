import { useToast, UseToastOptions } from "@chakra-ui/toast"
import { useState, useEffect, useCallback, ChangeEvent, ChangeEventHandler } from "react"
import { AlertMessageType } from "../globals"

export function useDebounce(value: any, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function useDebounceEffect(value: any, delay: number, callback: (debouncedValue: any) => void, dep: any[]) {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- We can't anticipate neither the values used in callback nor the deps.
  const memoizedCallback = useCallback(callback, dep)

  const debouncedValue = useDebounce(value, delay)

  useEffect(() => memoizedCallback(debouncedValue), [debouncedValue, memoizedCallback])
}

export function useInputValueChangeHandler(setter: (value: string) => void): ChangeEventHandler<HTMLInputElement> {
  return useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value
      setter(value)
    },
    [setter],
  )
}

/**
 * Update the title of the page and restore it when the component is unmouted.
 *
 * @param title title of the page
 */
export function useTitle(title: string) {
  useEffect(() => {
    document.title = title + " - Index Egapro"
  })
}

function showToastMessage(toast: ReturnType<typeof useToast>, options?: UseToastOptions) {
  return function (message: AlertMessageType) {
    if (message?.text) {
      toast({
        title: message.kind === "success" ? "Succès" : "Erreur",
        description: message.text,
        status: message.kind,
        isClosable: true,
        ...(options || {}),
      })
    }
  }
}

function showToastMessageNoDuplicate(toast: ReturnType<typeof useToast>, id: string, options?: UseToastOptions) {
  return function (message: AlertMessageType) {
    if (message?.text && !toast.isActive(id)) {
      toast({
        id,
        title: message.kind === "success" ? "Succès" : "Erreur",
        description: message.text,
        status: message.kind,
        isClosable: true,
        ...(options || {}),
      })
    }
  }
}

/**
 * Return utility to show toast messages.
 */
export function useToastMessage(options?: UseToastOptions) {
  const toast = useToast()

  const toastMessage = showToastMessage(toast, options)

  const toastSuccess = (text: string) => toastMessage({ kind: "success", text })
  const toastError = (text: string) => toastMessage({ kind: "error", text })

  return { toastMessage, toastSuccess, toastError }
}

/**
 * Return utility to show toast messages. Version that does not duplicate messages and handle the useEffect.
 */
export function useSoloToastMessage(id: string, message: AlertMessageType | null, options?: UseToastOptions) {
  const toast = useToast()
  const toastId = id

  const toastMessage = showToastMessageNoDuplicate(toast, toastId, options)

  useEffect(() => {
    if (message) {
      toastMessage(message)
    } else {
      toast.closeAll()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toast and toastMessage are utilities we don't need to subscribe to.
  }, [message])
}
