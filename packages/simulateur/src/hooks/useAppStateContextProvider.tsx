import React from "react"
import { createContext, PropsWithChildren, useCallback, useContext, useReducer } from "react"
import ReactPiwik from "react-piwik"
import AppReducer from "../AppReducer"
import { ActionType, AppState } from "../globals"

type AppStateContextType = { state: AppState | undefined; dispatch: React.Dispatch<ActionType> }

const AppStateContext = createContext<AppStateContextType | undefined>(undefined)

export const AppStateContextProvider = ({ children }: PropsWithChildren) => {
  const [state, dispatchReducer] = useReducer(AppReducer, undefined)
  const dispatch = useCallback(
    (action: ActionType) => {
      if (
        action.type.startsWith("validate") &&
        // @ts-ignore
        action.valid &&
        // @ts-ignore
        action.valid === "Valid"
      ) {
        ReactPiwik.push(["trackEvent", "validateForm", action.type])
      }
      dispatchReducer(action)
    },
    [dispatchReducer],
  )

  return <AppStateContext.Provider value={{ state, dispatch }}>{children}</AppStateContext.Provider>
}

export const useAppStateContextProvider = () => {
  const context = useContext(AppStateContext)
  if (context === undefined) {
    throw new Error("useAppStateContextProvider must be used within a AppStateContextProvider")
  }
  return context
}
