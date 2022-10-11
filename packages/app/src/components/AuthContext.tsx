import type { ApiError } from "next/dist/server/api-utils";
import { useRouter } from "next/router";
import type { PropsWithChildren } from "react";
import React, { createContext, useEffect, useCallback, useState } from "react";
import useSWR from "swr";

import { EXPIRED_TOKEN_MESSAGE, fetcher } from "../common/utils/fetcher";

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

type AuthContextType = {
  authProcess: "finished" | "running" | "unknown";
  email: string;
  isAuthenticated: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  ownership: string[];
  redirectTo?: string;
  refreshAuth: () => Promise<void>;
  staff: boolean;
};

const initialContext: AuthContextType = {
  email: "",
  ownership: [] as string[],
  staff: false,
  isAuthenticated: false,
  // eslint-disable-next-line @typescript-eslint/no-empty-function, unused-imports/no-unused-vars
  login: async (token: string) => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  logout: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  refreshAuth: async () => {},
  authProcess: "unknown",
};

const AuthContext = createContext(initialContext);
AuthContext.displayName = "AuthContext";

export const AuthContextProvider = ({ children }: PropsWithChildren) => {
  const router = useRouter();
  const [context, setContext] = useState(initialContext);

  const logout = useCallback(
    function logout() {
      console.log("logout");

      localStorage.setItem("token", "");
      setContext({ ...initialContext, authProcess: "finished" });

      if (context.redirectTo) router.push(context.redirectTo);
    },
    [context.redirectTo, router],
  );

  const login = useCallback(
    async (token: string) => {
      let newContext: typeof initialContext = { ...context, authProcess: "running" };
      setContext(newContext);

      localStorage.setItem("token", token);

      try {
        const tokenInfo = await getTokenInfo();
        console.debug("Connexion OK", { tokenInfo });

        if (tokenInfo) {
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

        logout();
      }

      setContext({ ...newContext, authProcess: "finished" });
    },
    [context, logout],
  );

  const refreshAuth = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (token) {
      await login(token);
    } else {
      console.debug("Impossible de rafraîchir les données de l'utilisateur car aucun token n'est présent");
    }
  }, [login]);

  useEffect(() => {
    // tentative de login au mount du composant

    console.log("context.redirectTo", context.redirectTo);

    const token = localStorage.getItem("token");
    if (token) login(token);
    else if (context.redirectTo) logout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <AuthContext.Provider value={{ ...context, logout, login, refreshAuth }}>{children}</AuthContext.Provider>;
};

export const useUser = (props?: { redirectTo: string } | undefined) => {
  const redirectTo = props?.redirectTo;

  const router = useRouter();
  const { data: user, error, mutate: mutateUser } = useSWR<TokenInfoType>("/me", fetcher);

  const logout = () => {
    console.log("logout");

    localStorage.setItem("token", "");

    if (redirectTo) router.push(redirectTo);
  };

  const login = (token: string) => {
    localStorage.setItem("token", token);
    mutateUser();
  };

  return {
    user,
    error,
    login,
    logout,
  };
};

/**
 * Check if a token is present in the URL bar. If so, run login with it.
 *
 * Use this hook carefully, i.e. on pages which expect to be a landing page of an email token lin, because the useEffect in this function is called at every render.
 */
export const useCheckTokenInURL = () => {
  const { login, user, error } = useUser();
  const router = useRouter();

  const loading = !user && !error;

  // This useEffect is called at every render, becacuse we need to try to login with the token in the URL.
  useEffect(() => {
    async function runEffect() {
      const urlParams = new URLSearchParams(window.location.search);

      const tokenInURL = urlParams.get("token");

      // Check also loading to not attempt a login call if a precedent login call is already initiated.
      if (tokenInURL && loading) {
        console.debug("Token trouvé dans l'URL. Tentative de connexion...");
        login(tokenInURL);
        // Reset the token in the search params so it won't be in the URL and won't be bookmarkable (which is a bad practice?)
        // router.push({ search: "" });
      }
    }

    runEffect();
  });
};

export const useLogoutIfExpiredToken = (error: ApiError) => {
  const { logout } = useUser();
  useEffect(() => {
    if (error.message === EXPIRED_TOKEN_MESSAGE) {
      logout();
    }
  }, [error, logout]);
};

export const useTokenAndRedirect = (redirectUrl: string) => {
  const router = useRouter();
  // Handle the case where the user has clicked in a mail in a link with a token.
  useCheckTokenInURL();

  const { user } = useUser();

  if (user?.email) router.push(redirectUrl);
};
