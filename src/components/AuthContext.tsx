import React from "react"
import { getTokenInfo } from "../utils/api"

const initialContext = {
  email: "",
  ownership: [] as string[],
  staff: false,
  isAuthenticated: false,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  logout: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  login: (token: string) => {},
}

const AuthContext = React.createContext(initialContext)
AuthContext.displayName = "AuthContext"

// TODO : ne plus utiliser que ce contexte. En particulier, dans Simulateur, il y a tout un traitement qui utilise getTokenInfo directement.

export function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const [context, setContext] = React.useState(initialContext)

  async function login(token: string) {
    if (token) {
      localStorage.setItem("token", token)

      try {
        const tokenInfo = await getTokenInfo()

        if (tokenInfo) {
          localStorage.setItem("tokenInfo", JSON.stringify(tokenInfo?.jsonBody) || "")

          const newContext = {
            ...context,
            ...(tokenInfo?.jsonBody?.email && { email: tokenInfo?.jsonBody?.email }),
            ...(tokenInfo?.jsonBody?.ownership && { ownership: tokenInfo?.jsonBody?.ownership }),
            ...(tokenInfo?.jsonBody?.staff && { staff: tokenInfo?.jsonBody?.staff }),
            isAuthenticated: Boolean(tokenInfo?.jsonBody?.email),
          }

          setContext(newContext)
        }
      } catch (error) {
        // If token has expired, we remove it from localStorage and state.
        console.error(error)

        localStorage.setItem("token", "")
        localStorage.setItem("tokenInfo", "")
      }
    }
  }

  function logout() {
    localStorage.setItem("token", "")
    localStorage.setItem("tokenInfo", "")
    setContext(initialContext)
  }

  React.useEffect(() => {
    // tentative de login au mount du composant
    login(localStorage.getItem("token") || "")
  }, [])

  return <AuthContext.Provider value={{ ...context, logout, login }}>{children}</AuthContext.Provider>
}

export function useUser(): typeof initialContext {
  const context = React.useContext(AuthContext)

  if (!context) throw new Error("useUser must be used in a <AuthContextProvider />")

  return context
}
