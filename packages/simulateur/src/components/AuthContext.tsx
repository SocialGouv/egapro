import React, { PropsWithChildren, useCallback, useContext, useEffect, useState } from "react"

import { useHistory } from "react-router-dom"
import { getTokenInfo } from "../utils/api"
import { EXPIRED_TOKEN_MESSAGE, FetchError } from "../utils/fetcher"

const initialContext = {
  email: "",
  ownership: [] as string[],
  staff: false,
  isAuthenticated: false,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  login: (token: string) => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  logout: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  refreshAuth: () => {},
  loading: false,
}

const AuthContext = React.createContext(initialContext)
AuthContext.displayName = "AuthContext"

// TODO : ne plus utiliser que ce contexte. En particulier, dans Simulateur, il y a tout un traitement qui utilise getTokenInfo directement.

export const AuthContextProvider = ({ children }: PropsWithChildren) => {
  const [context, setContext] = useState(initialContext)

  const login = useCallback(
    async (token: string) => {
      let newContext: typeof initialContext = { ...context, loading: true }
      setContext(newContext)

      if (token) {
        localStorage.setItem("token", token)

        try {
          const tokenInfo = await getTokenInfo()

          if (tokenInfo) {
            const tokenInfoStr = JSON.stringify(tokenInfo?.jsonBody)
            if (!tokenInfoStr) {
              throw new Error("Can't save empty tokenInfo.")
            }
            localStorage.setItem("tokenInfo", tokenInfoStr)

            newContext = {
              ...context,
              ...(tokenInfo?.jsonBody?.email && { email: tokenInfo?.jsonBody?.email }),
              ...(tokenInfo?.jsonBody?.ownership && { ownership: tokenInfo?.jsonBody?.ownership }),
              ...(tokenInfo?.jsonBody?.staff && { staff: tokenInfo?.jsonBody?.staff }),
              isAuthenticated: Boolean(tokenInfo?.jsonBody?.email),
            }
          }
        } catch (error) {
          // If token has expired, we remove it from localStorage and state.
          console.error(error)

          localStorage.removeItem("token")
          localStorage.removeItem("tokenInfo")
        }
      }
      setContext({ ...newContext, loading: false })
    },
    [context],
  )

  const refreshAuth = useCallback(async () => {
    const token = localStorage.getItem("token")
    if (token) {
      await login(token)
    } else {
      console.debug("Impossible de rafraîchir les données de l'utilisateur car aucun token n'est présent")
    }
  }, [login])

  const logout = useCallback(function logout() {
    localStorage.removeItem("token")
    localStorage.removeItem("tokenInfo")
    localStorage.removeItem("ega-token")
    setContext({ ...initialContext, loading: false })
  }, [])

  useEffect(() => {
    // tentative de login au mount du composant
    login(localStorage.getItem("token") || "")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <AuthContext.Provider value={{ ...context, logout, login, refreshAuth }}>{children}</AuthContext.Provider>
}

export function useUser(): typeof initialContext {
  const context = useContext(AuthContext)

  if (!context) throw new Error("useUser must be used in a <AuthContextProvider />")

  return context
}

/**
 * Check if a token is present in the URL bar. If so, run login with it.
 */
export function useCheckTokenInURL() {
  const { login } = useUser()
  const history = useHistory()

  // useEffect called at every render, to try to login with the token in the URL.
  useEffect(() => {
    async function runEffect() {
      const urlParams = new URLSearchParams(window.location.search)

      const tokenInURL = urlParams.get("token")

      if (tokenInURL) {
        await login(tokenInURL)
        // Reset the token in the search params so it won't be in the URL and won't be bookmarkable (which is a bad practice?)
        history.push({ search: "" })
      }
    }

    runEffect()
  })
}

export function useLogoutIfExpiredToken(error: FetchError) {
  const { logout } = useUser()
  useEffect(() => {
    if (error?.info === EXPIRED_TOKEN_MESSAGE) {
      logout()
    }
  }, [error, logout])
}
