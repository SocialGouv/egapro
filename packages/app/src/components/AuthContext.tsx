import { useRouter } from "next/router";
import React from "react";

import type { FetchError } from "hooks/utils";
import { EXPIRED_TOKEN_MESSAGE, fetcher } from "hooks/utils";

// TODO: type à confirmer par rapport au endpoint /!\
type DeclarationSummary = {
  declared_at: number | null;
  modified_at: number;
  name: string | null;
  siren: string;
  year: number;
};

type TokenInfoType = {
  déclarations: DeclarationSummary[];
  email: string;
  ownership: string[];
  staff: boolean;
};

// TODO: améliorer le type de retour de fetcher pour ne pas avoir à caster ici.
export const getTokenInfo = () => fetcher(`/me`) as Promise<TokenInfoType>;

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
};

const AuthContext = React.createContext(initialContext);
AuthContext.displayName = "AuthContext";

// TODO : ne plus utiliser que ce contexte. En particulier, dans Simulateur, il y a tout un traitement qui utilise getTokenInfo directement.

export function AuthContextProvider({ children }: { children: React.ReactNode }) {
  const [context, setContext] = React.useState(initialContext);

  const login = React.useCallback(
    async (token: string) => {
      let newContext: typeof initialContext = { ...context, loading: true };
      setContext(newContext);

      if (token) {
        localStorage.setItem("token", token);

        try {
          const tokenInfo = await getTokenInfo();
          console.debug("Connexion OK", { tokenInfo });

          if (tokenInfo) {
            localStorage.setItem("tokenInfo", JSON.stringify(tokenInfo) || "");

            newContext = {
              ...context,
              ...(tokenInfo?.email && { email: tokenInfo?.email }),
              ...(tokenInfo?.ownership && { ownership: tokenInfo?.ownership }),
              ...(tokenInfo?.staff && { staff: tokenInfo?.staff }),
              isAuthenticated: Boolean(tokenInfo?.email),
            };
          }
        } catch (error) {
          // If token has expired, we remove it from localStorage and state.
          console.error("Connexion erreur", error);

          localStorage.setItem("token", "");
          localStorage.setItem("tokenInfo", "");
        }
      }
      setContext({ ...newContext, loading: false });
    },
    [context],
  );

  const refreshAuth = React.useCallback(async () => {
    const token = localStorage.getItem("token");
    if (token) {
      await login(token);
    } else {
      console.debug("Impossible de rafraîchir les données de l'utilisateur car aucun token n'est présent");
    }
  }, [login]);

  const logout = React.useCallback(function logout() {
    localStorage.setItem("token", "");
    localStorage.setItem("tokenInfo", "");
    setContext({ ...initialContext, loading: false });
  }, []);

  React.useEffect(() => {
    // tentative de login au mount du composant
    login(localStorage.getItem("token") || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <AuthContext.Provider value={{ ...context, logout, login, refreshAuth }}>{children}</AuthContext.Provider>;
}

export function useUser(): typeof initialContext {
  const context = React.useContext(AuthContext);

  if (!context) throw new Error("useUser must be used in a <AuthContextProvider />");

  return context;
}

/**
 * Check if a token is present in the URL bar. If so, run login with it.
 *
 * Use this hook carefully, i.e. on pages which expect to be a landing page of an email token lin, because the useEffect in this function is called at every render.
 */
export function useCheckTokenInURL() {
  const { login, loading } = useUser();
  const router = useRouter();

  // This useEffect is called at every render, becacuse we need to try to login with the token in the URL.
  React.useEffect(() => {
    async function runEffect() {
      const urlParams = new URLSearchParams(window.location.search);

      const tokenInURL = urlParams.get("token");

      // Check also loading to not attempt a login call if a precedent login call is already initiated.
      if (tokenInURL && !loading) {
        console.debug("Token trouvé dans l'URL. Tentative de connexion...");
        await login(tokenInURL);
        // Reset the token in the search params so it won't be in the URL and won't be bookmarkable (which is a bad practice?)
        router.push({ search: "" });
      }
    }

    runEffect();
  });
}

export function useLogoutIfExpiredToken(error: FetchError) {
  const { logout } = useUser();
  React.useEffect(() => {
    if (error?.info === EXPIRED_TOKEN_MESSAGE) {
      logout();
    }
  }, [error, logout]);
}

export const useTokenAndRedirect = (redirectUrl: string) => {
  const router = useRouter();
  // Handle the case where the user has clicked in a mail in a link with a token.
  useCheckTokenInURL();

  const { isAuthenticated } = useUser();

  if (isAuthenticated) router.push(redirectUrl);
};
