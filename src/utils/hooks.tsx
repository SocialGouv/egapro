import React from "react"
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

interface UseDataFetchingResult<SearchResult> {
  result: SearchResult
  loading: boolean
}

export function useDataFetching<SearchResult, SearchParams, DebouncedParams>(
  fetchFunction: (params: SearchParams, debouncedParams: DebouncedParams) => Promise<SearchResult>,
  params: SearchParams,
  debouncedParams: DebouncedParams,
  delay: number,
): UseDataFetchingResult<SearchResult | null> {
  const [result, setResult] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  useEffect(() => {
    setLoading(true)
  }, [params, debouncedParams])
  useDebounceEffect(
    debouncedParams,
    delay,
    (debouncedParams) => {
      fetchFunction(params, debouncedParams).then((fetchedResults) => {
        setResult(fetchedResults)
        setLoading(false)
      })
    },
    [fetchFunction, params],
  )

  return {
    result,
    loading,
  }
}

/**
 * Update the title of the page and restore it when the component is unmouted.
 *
 * @param title title of the page
 */
export function useTitle(title: string) {
  useEffect(() => {
    const prevTitle = document.title
    document.title = title + " - " + prevTitle
    return () => {
      document.title = prevTitle
    }
  })
}

/**
 * Utility to retrive user's info.
 *
 * @returns the information for the authenticated user
 */
export function useUser(): { email: string; ownership: string[]; logout: () => void } {
  const tokenInfoLS = localStorage.getItem("tokenInfo")
  const { email, ownership } = tokenInfoLS ? JSON.parse(tokenInfoLS) : { email: "", ownership: [] }

  function logout() {
    localStorage.setItem("token", "")
    localStorage.setItem("tokenInfo", "")
  }

  return { email, ownership, logout }
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
